import { useState, useEffect } from 'react';
import { api, Exam, Category } from '../lib/api';
import { Plus, Edit, Trash2, X, Save, Loader2, Link2 } from 'lucide-react';

export function AdminExamManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', description: '' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [examCategoryMappings, setExamCategoryMappings] = useState<Record<string, Category[]>>({});
  const [formErrors, setFormErrors] = useState<{name?: string; categories?: string}>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [examList, categoryList] = await Promise.all([
        api.adminGetExams(),
        api.adminGetCategories()
      ]);
      setExams(examList);
      setCategories(categoryList);
      
      // Load category mappings for each exam
      const mappings: Record<string, Category[]> = {};
      for (const exam of examList) {
        try {
          const examCategories = await api.adminGetExamCategories(exam.id);
          mappings[exam.id] = examCategories;
        } catch (err) {
          mappings[exam.id] = [];
        }
      }
      setExamCategoryMappings(mappings);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async () => {
    try {
      const examList = await api.adminGetExams();
      setExams(examList);
    } catch (err: any) {
      setError(err.message || 'Failed to load exams');
    }
  };

  const handleCreate = () => {
    setEditingExam(null);
    setFormData({ name: '', category: '', description: '' });
    setSelectedCategories([]);
    setFormErrors({});
    setError('');
    setShowForm(true);
  };

  const handleEdit = async (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      category: exam.category || '',
      description: exam.description || ''
    });
    setFormErrors({});
    setError('');
    
    // Load current category mappings for this exam
    try {
      const examCategories = await api.adminGetExamCategories(exam.id);
      setSelectedCategories(examCategories.map((c: Category) => c.id));
    } catch (err) {
      setSelectedCategories([]);
    }
    
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    const errors: {name?: string; categories?: string} = {};
    
    // Validate name
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Exam name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Exam name must be at least 2 characters';
    }
    
    // Validate at least one category is selected
    if (selectedCategories.length === 0) {
      errors.categories = 'Please select at least one category for this exam';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the errors below');
      return;
    }
    
    try {
      setError('');
      setFormErrors({});
      let examId: string;
      
      if (editingExam) {
        await api.adminUpdateExam(editingExam.id, formData);
        examId = editingExam.id;
      } else {
        const response = await api.adminCreateExam(formData);
        examId = response.id || response.exam?.id || editingExam?.id || '';
        if (!examId) {
          throw new Error('Failed to get exam ID from response');
        }
      }
      
      // Update exam-category mappings
      const currentCategories = examCategoryMappings[examId] || [];
      const currentCategoryIds = currentCategories.map(c => c.id);
      
      // Remove categories that are no longer selected
      for (const categoryId of currentCategoryIds) {
        if (!selectedCategories.includes(categoryId)) {
          await api.adminRemoveExamCategory(examId, categoryId);
        }
      }
      
      // Add newly selected categories
      for (const categoryId of selectedCategories) {
        if (!currentCategoryIds.includes(categoryId)) {
          await api.adminAddExamCategory(examId, categoryId);
        }
      }
      
      setShowForm(false);
      setFormErrors({});
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save exam');
    }
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      // Clear error when selection changes
      if (formErrors.categories && newSelection.length > 0) {
        setFormErrors({ ...formErrors, categories: undefined });
      }
      
      return newSelection;
    });
  };

  const handleDelete = async (examId: string) => {
    try {
      // Get deletion impact
      const impact = await api.adminGetExamDeletionImpact(examId);
      
      // Build warning message
      const warnings: string[] = [];
      const info: string[] = [];
      
      if (impact.category_mappings_to_remove > 0) {
        warnings.push(`• ${impact.category_mappings_to_remove} category mapping(s) will be removed`);
        info.push(`  (Categories will remain, only mappings will be removed)`);
      }
      
      if (impact.users_assigned > 0) {
        warnings.push(`• ${impact.users_assigned} user(s) will have their exam assignment cleared`);
        info.push(`  (Users will remain, only exam_id will be set to NULL)`);
      }
      
      if (impact.questions_no_longer_accessible > 0) {
        warnings.push(`• ${impact.questions_no_longer_accessible} question(s) will no longer be accessible through this exam`);
        info.push(`  (Questions will NOT be deleted, they will remain in the database)`);
      }
      
      if (impact.orphaned_categories_count > 0) {
        const orphanedNames = impact.orphaned_categories.map((c: any) => c.name).join(', ');
        warnings.push(`• ${impact.orphaned_categories_count} category/categories will become orphaned: ${orphanedNames}`);
        info.push(`  (These categories will remain but won't be associated with any exam)`);
      }
      
      const warningMsg = warnings.length > 0
        ? `Deleting "${impact.exam_name}" will:\n\n${warnings.join('\n')}\n\n${info.join('\n')}\n\nIMPORTANT:\n• Categories will NOT be deleted\n• Questions will NOT be deleted\n• Only exam-category mappings will be removed\n\nAre you sure you want to proceed?`
        : `Are you sure you want to delete "${impact.exam_name}"?\n\nNote: Categories and questions will remain unchanged.`;
      
      if (!confirm(warningMsg)) return;
      
      setError('');
      await api.adminDeleteExam(examId);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete exam');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Exam Management</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add Exam</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingExam ? 'Edit Exam' : 'Create Exam'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., JEE, NEET, UPSC"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Engineering, Medical"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Exam description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Categories *
              </label>
              <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${
                formErrors.categories ? 'border-red-500' : 'border-gray-300'
              }`}>
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">No categories available</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategorySelection(category.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                        <span className="text-xs text-gray-500 truncate max-w-xs">
                          - {category.description}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formErrors.categories ? (
                <p className="mt-1 text-sm text-red-600">{formErrors.categories}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Select which categories should be available for this exam
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categories
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No exams found
                </td>
              </tr>
            ) : (
              exams.map((exam) => {
                const mappedCategories = examCategoryMappings[exam.id] || [];
                const categoryNames = mappedCategories.map(c => c.name).join(', ') || 'None';
                
                return (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {exam.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exam.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {exam.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="max-w-xs truncate" title={categoryNames}>
                          {categoryNames}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(exam)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}


