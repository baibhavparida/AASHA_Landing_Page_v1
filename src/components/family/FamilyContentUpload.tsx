import React, { useState, useEffect } from 'react';
import { Upload, Plus, X, Tag, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { getSharedContent, addSharedContent, deleteSharedContent } from '../../services/familyDashboardService';

interface FamilyContentUploadProps {
  elderlyProfile: {
    id: string;
    first_name: string;
  };
}

const FamilyContentUpload: React.FC<FamilyContentUploadProps> = ({ elderlyProfile }) => {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    content_type: 'family_news' as any,
    title: '',
    description: '',
    mention_priority: 'normal' as any,
    tags: [] as string[],
    expiration_date: '',
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadContent();
  }, [elderlyProfile.id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getSharedContent(elderlyProfile.id);
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSharedContent({
        elderly_profile_id: elderlyProfile.id,
        ...formData,
      });
      setShowAddForm(false);
      setFormData({
        content_type: 'family_news',
        title: '',
        description: '',
        mention_priority: 'normal',
        tags: [],
        expiration_date: '',
      });
      loadContent();
    } catch (error) {
      console.error('Error adding content:', error);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteSharedContent(contentId);
        loadContent();
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: any = {
      family_news: 'Family News',
      photo: 'Photo',
      milestone: 'Milestone',
      reminder: 'Reminder',
      conversation_topic: 'Conversation Topic',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#F35E4A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Content
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Content</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Content Type</label>
                <select
                  value={formData.content_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_type: e.target.value as any }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F35E4A]"
                  required
                >
                  <option value="family_news">Family News</option>
                  <option value="photo">Photo</option>
                  <option value="milestone">Milestone</option>
                  <option value="reminder">Reminder</option>
                  <option value="conversation_topic">Conversation Topic</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Priority</label>
                <select
                  value={formData.mention_priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, mention_priority: e.target.value as any }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F35E4A]"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Sarah's graduation"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F35E4A]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you'd like Aasha to mention..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F35E4A]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Tags (for topic categorization)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F35E4A]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Add Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Expiration Date (Optional)</label>
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F35E4A]"
              />
              <p className="text-sm text-gray-600 mt-1">Content will no longer be mentioned after this date</p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-[#F35E4A] text-white rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
              >
                Save Content
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Shared Content</h3>
        {content.length > 0 ? (
          <div className="space-y-4">
            {content.map((item) => (
              <div key={item.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-[#F35E4A] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {getContentTypeLabel(item.content_type)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.mention_priority)}`}>
                        {item.mention_priority}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{item.description}</p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.tags.map((tag: string) => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Mentioned {item.mentioned_count} times</span>
                      {item.last_mentioned_at && (
                        <span>Last mentioned: {new Date(item.last_mentioned_at).toLocaleDateString()}</span>
                      )}
                      {item.expiration_date && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Expires: {new Date(item.expiration_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No content shared yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[#F35E4A] font-semibold hover:underline"
            >
              Share your first content
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyContentUpload;
