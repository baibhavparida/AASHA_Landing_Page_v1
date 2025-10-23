import { supabase } from '../lib/supabase';
import type { OnboardingData } from '../components/Onboarding';
import { validateDate, sanitizeDate, validateOnboardingData } from '../utils/validation';

export async function checkPhoneNumberExists(phoneNumber: string, countryCode: string): Promise<boolean> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-phone-exists`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, countryCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Phone check API error:', errorData);
      return false;
    }

    const result = await response.json();
    return result.exists === true;
  } catch (error) {
    console.error('Error checking phone number:', error);
    return false;
  }
}

export async function saveOnboardingData(data: OnboardingData) {
  try {
    if (data.registrationType === 'myself') {
      return await saveMyselfRegistration(data);
    } else if (data.registrationType === 'loved-one') {
      return await saveLovedOneRegistration(data);
    } else {
      throw new Error('Invalid registration type');
    }
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    throw error;
  }
}

async function saveMyselfRegistration(data: OnboardingData) {
  const validationErrors = validateOnboardingData({
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    language: data.language,
    maritalStatus: data.maritalStatus,
  });

  if (validationErrors.length > 0) {
    const errorMessage = validationErrors.map(e => e.message).join(', ');
    throw new Error(`Validation failed: ${errorMessage}`);
  }

  const sanitizedDateOfBirth = sanitizeDate(data.dateOfBirth);
  if (!sanitizedDateOfBirth) {
    throw new Error('Invalid date of birth format. Please use a valid date.');
  }

  const email = `${data.phoneNumber}@aasha-temp.com`;
  const password = generateTemporaryPassword(data.phoneNumber);

  let userId: string;
  let isExistingAuth = false;

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone_number', data.phoneNumber)
    .eq('country_code', data.countryCode)
    .maybeSingle();

  if (existingProfile) {
    throw new Error('User already registered');
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined,
      data: {
        phone: `${data.countryCode}${data.phoneNumber}`,
      }
    }
  });

  if (signUpError) {
    console.error('Signup error:', signUpError);
    if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered') || signUpError.message.includes('User already registered')) {
      try {
        const cleanupResult = await cleanupOrphanedAuth(data.phoneNumber, data.countryCode);
        console.log('Cleanup result:', cleanupResult);

        if (cleanupResult.hasProfile) {
          throw new Error('This phone number is already registered with a complete profile. Please use a different number.');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const retryAuth = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined,
            data: {
              phone: `${data.countryCode}${data.phoneNumber}`,
            }
          }
        });

        if (retryAuth.error) {
          console.error('Retry signup error:', retryAuth.error);
          throw new Error(`Failed to create account after cleanup: ${retryAuth.error.message}`);
        }
        if (!retryAuth.data.user) throw new Error('User creation failed after cleanup');
        userId = retryAuth.data.user.id;

        if (!retryAuth.data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            throw new Error(`Failed to authenticate: ${signInError.message}`);
          }
        }
      } catch (cleanupError: any) {
        console.error('Cleanup error:', cleanupError);
        throw new Error(cleanupError.message || 'This phone number has a partial registration. Please try again in a few moments.');
      }
    } else {
      throw new Error(`Failed to create account: ${signUpError.message}`);
    }
  } else {
    if (!authData.user) throw new Error('User creation failed');
    userId = authData.user.id;

    if (!authData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error after signup:', signInError);
        throw new Error(`Failed to authenticate: ${signInError.message}`);
      }
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      phone_number: data.phoneNumber,
      country_code: data.countryCode,
      first_name: data.firstName,
      last_name: data.lastName,
      date_of_birth: sanitizedDateOfBirth,
      gender: data.gender,
      language: data.language,
      marital_status: data.maritalStatus,
      registration_type: 'myself',
    })
    .select()
    .single();

  if (profileError) {
    console.error('Profile insert error:', profileError);
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  const callTimePreference = mapCallTimeToPreference(data.callTime, data.customTimeRange);
  const toNumber = `${data.countryCode}${data.phoneNumber.replace(/\D/g, '')}`;

  const { data: elderlyProfile, error: elderlyError } = await supabase
    .from('elderly_profiles')
    .insert({
      profile_id: userId,
      caregiver_profile_id: null,
      phone_number: data.phoneNumber,
      country_code: data.countryCode,
      to_number: toNumber,
      first_name: data.firstName,
      last_name: data.lastName,
      date_of_birth: sanitizedDateOfBirth,
      gender: data.gender,
      language: data.language,
      marital_status: data.maritalStatus,
      call_time_preference: callTimePreference,
      relationship_to_caregiver: null,
      telegram_username: data.telegramUsername || null,
    })
    .select()
    .single();

  if (elderlyError) {
    console.error('Elderly profile insert error:', elderlyError);
    throw new Error(`Failed to create elderly profile: ${elderlyError.message}`);
  }

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ elderly_profile_id: elderlyProfile.id })
    .eq('id', userId);

  if (profileUpdateError) {
    console.error('Profile update error (elderly_profile_id):', profileUpdateError);
  }

  await saveMedications(elderlyProfile.id, data.medications);
  await saveInterests(elderlyProfile.id, data.interests);

  await createInitialCallRecord(elderlyProfile.id);

  const result = { userId, profileId: profile.id, elderlyProfileId: elderlyProfile.id };

  await sendWebhook({
    ...result,
    registrationType: 'myself',
    phoneNumber: data.phoneNumber,
    countryCode: data.countryCode,
    toNumber: toNumber,
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    language: data.language,
    maritalStatus: data.maritalStatus,
    callTimePreference: callTimePreference,
    medications: data.medications,
    interests: data.interests,
  });

  return result;
}

async function saveLovedOneRegistration(data: OnboardingData) {
  if (!data.firstName || !data.lastName) {
    throw new Error('First name and last name are required');
  }

  if (!data.relationship) {
    throw new Error('Relationship with loved one is required');
  }

  const lovedOneValidationErrors = validateOnboardingData({
    firstName: data.lovedOneFirstName,
    lastName: data.lovedOneLastName,
    dateOfBirth: data.lovedOneDateOfBirth,
    gender: data.lovedOneGender,
    language: data.lovedOneLanguage,
    maritalStatus: data.lovedOneMaritalStatus,
  });

  if (lovedOneValidationErrors.length > 0) {
    const errorMessage = lovedOneValidationErrors.map(e => e.message).join(', ');
    throw new Error(`Loved one validation failed: ${errorMessage}`);
  }

  const sanitizedLovedOneDOB = sanitizeDate(data.lovedOneDateOfBirth);

  if (!sanitizedLovedOneDOB) {
    throw new Error('Invalid loved one date of birth format. Please use a valid date.');
  }

  const email = `${data.phoneNumber}@aasha-temp.com`;
  const password = generateTemporaryPassword(data.phoneNumber);

  let caregiverId: string;

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone_number', data.phoneNumber)
    .eq('country_code', data.countryCode)
    .maybeSingle();

  if (existingProfile) {
    throw new Error('User already registered');
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined,
      data: {
        phone: `${data.countryCode}${data.phoneNumber}`,
      }
    }
  });

  if (signUpError) {
    console.error('Signup error:', signUpError);
    if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered') || signUpError.message.includes('User already registered')) {
      try {
        const cleanupResult = await cleanupOrphanedAuth(data.phoneNumber, data.countryCode);
        console.log('Cleanup result:', cleanupResult);

        if (cleanupResult.hasProfile) {
          throw new Error('This phone number is already registered with a complete profile. Please use a different number.');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const retryAuth = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined,
            data: {
              phone: `${data.countryCode}${data.phoneNumber}`,
            }
          }
        });

        if (retryAuth.error) {
          console.error('Retry signup error:', retryAuth.error);
          throw new Error(`Failed to create account after cleanup: ${retryAuth.error.message}`);
        }
        if (!retryAuth.data.user) throw new Error('User creation failed after cleanup');
        caregiverId = retryAuth.data.user.id;

        if (!retryAuth.data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            throw new Error(`Failed to authenticate: ${signInError.message}`);
          }
        }
      } catch (cleanupError: any) {
        console.error('Cleanup error:', cleanupError);
        throw new Error(cleanupError.message || 'This phone number has a partial registration. Please try again in a few moments.');
      }
    } else {
      throw new Error(`Failed to create account: ${signUpError.message}`);
    }
  } else {
    if (!authData.user) throw new Error('User creation failed');
    caregiverId = authData.user.id;

    if (!authData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error after signup:', signInError);
        throw new Error(`Failed to authenticate: ${signInError.message}`);
      }
    }
  }

  const { data: caregiverProfile, error: caregiverError } = await supabase
    .from('profiles')
    .insert({
      id: caregiverId,
      phone_number: data.phoneNumber,
      country_code: data.countryCode,
      first_name: data.firstName,
      last_name: data.lastName,
      date_of_birth: null,
      gender: null,
      language: data.language || 'English',
      marital_status: null,
      registration_type: 'loved-one',
    })
    .select()
    .single();

  if (caregiverError) {
    console.error('Caregiver profile insert error:', caregiverError);
    throw new Error(`Failed to create caregiver profile: ${caregiverError.message}`);
  }

  const callTimePreference = mapCallTimeToPreference(data.callTime, data.customTimeRange);
  const lovedOneToNumber = `${data.lovedOneCountryCode}${data.lovedOnePhoneNumber!.replace(/\D/g, '')}`;

  const { data: elderlyProfile, error: elderlyError } = await supabase
    .from('elderly_profiles')
    .insert({
      profile_id: null,
      caregiver_profile_id: caregiverId,
      phone_number: data.lovedOnePhoneNumber!,
      country_code: data.lovedOneCountryCode!,
      to_number: lovedOneToNumber,
      first_name: data.lovedOneFirstName!,
      last_name: data.lovedOneLastName!,
      date_of_birth: sanitizedLovedOneDOB,
      gender: data.lovedOneGender!,
      language: data.lovedOneLanguage!,
      marital_status: data.lovedOneMaritalStatus!,
      call_time_preference: callTimePreference,
      relationship_to_caregiver: data.relationship!,
      telegram_username: data.lovedOneTelegramUsername || null,
    })
    .select()
    .single();

  if (elderlyError) {
    console.error('Elderly profile insert error (loved-one):', elderlyError);
    throw new Error(`Failed to create elderly profile: ${elderlyError.message}`);
  }

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ elderly_profile_id: elderlyProfile.id })
    .eq('id', caregiverId);

  if (profileUpdateError) {
    console.error('Profile update error (elderly_profile_id):', profileUpdateError);
  }

  await saveMedications(elderlyProfile.id, data.medications);
  await saveInterests(elderlyProfile.id, data.interests);

  await createInitialCallRecord(elderlyProfile.id);

  const result = { userId: caregiverId, profileId: caregiverProfile.id, elderlyProfileId: elderlyProfile.id };

  await sendWebhook({
    ...result,
    registrationType: 'loved-one',
    phoneNumber: data.phoneNumber,
    countryCode: data.countryCode,
    firstName: data.firstName,
    lastName: data.lastName,
    relationship: data.relationship,
    callTimePreference: callTimePreference,
    medications: data.medications,
    interests: data.interests,
    lovedOne: {
      phoneNumber: data.lovedOnePhoneNumber!,
      countryCode: data.lovedOneCountryCode!,
      toNumber: lovedOneToNumber,
      firstName: data.lovedOneFirstName!,
      lastName: data.lovedOneLastName!,
      dateOfBirth: data.lovedOneDateOfBirth!,
      gender: data.lovedOneGender!,
      language: data.lovedOneLanguage!,
      maritalStatus: data.lovedOneMaritalStatus!,
      relationship: data.relationship!,
    },
  });

  return result;
}

async function saveMedications(elderlyProfileId: string, medications: OnboardingData['medications']) {
  if (medications.length === 0) return;

  const medicationsToInsert = medications.map(med => ({
    elderly_profile_id: elderlyProfileId,
    name: med.name,
    dosage_quantity: med.dosage_quantity,
    times_of_day: med.times_of_day,
  }));

  const { error } = await supabase
    .from('medications')
    .insert(medicationsToInsert);

  if (error) {
    console.error('Medications insert error:', error);
    throw new Error(`Failed to save medications: ${error.message}`);
  }
}

async function saveInterests(elderlyProfileId: string, interests: string[]) {
  if (interests.length === 0) return;

  const interestsToInsert = interests.map(interest => ({
    elderly_profile_id: elderlyProfileId,
    interest,
  }));

  const { error } = await supabase
    .from('interests')
    .insert(interestsToInsert);

  if (error) {
    console.error('Interests insert error:', error);
    throw new Error(`Failed to save interests: ${error.message}`);
  }
}

function mapCallTimeToPreference(
  callTime: string,
  customTimeRange?: { start: string; end: string }
): 'morning' | 'afternoon' | 'evening' {
  if (callTime === 'morning') return 'morning';
  if (callTime === 'afternoon') return 'afternoon';
  if (callTime === 'evening') return 'evening';

  if (callTime === 'custom' && customTimeRange) {
    const startHour = parseInt(customTimeRange.start.split(':')[0]);
    if (startHour >= 6 && startHour < 12) return 'morning';
    if (startHour >= 12 && startHour < 17) return 'afternoon';
    return 'evening';
  }

  return 'afternoon';
}

function generateTemporaryPassword(phoneNumber: string): string {
  const hash = phoneNumber.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `aasha_${Math.abs(hash)}_${phoneNumber.slice(-4)}_temp_pw_2025`;
}

async function cleanupOrphanedAuth(phoneNumber: string, countryCode: string): Promise<{ success: boolean; hasProfile?: boolean; cleaned?: boolean; message?: string }> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-orphaned-auth`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, countryCode }),
    });

    const result = await response.json();
    console.log('Cleanup result:', result);

    if (!response.ok) {
      console.error('Cleanup function failed:', result);
      throw new Error(result.details || result.error || 'Failed to cleanup orphaned auth user');
    }

    return result;
  } catch (error: any) {
    console.error('Error calling cleanup function:', error);
    throw new Error(error.message || 'Failed to cleanup orphaned auth user');
  }
}

async function createInitialCallRecord(elderlyProfileId: string) {
  try {
    const { error } = await supabase
      .from('calls')
      .insert({
        elderly_profile_id: elderlyProfileId,
      });

    if (error) {
      console.error('Error creating initial call record:', error);
    } else {
      console.log('Initial call record created successfully for elderly_profile_id:', elderlyProfileId);
    }
  } catch (error) {
    console.warn('Error creating initial call record (non-blocking):', error);
  }
}

async function sendWebhook(data: any) {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-registration-webhook`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Webhook call failed (non-blocking):', errorText);
    } else {
      console.log('Webhook sent successfully');
    }
  } catch (error) {
    console.warn('Error sending webhook (non-blocking):', error);
  }
}
