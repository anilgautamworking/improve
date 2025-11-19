import { useState, useEffect } from 'react';
import { api, Category, Exam } from '../lib/api';
import { Plus, Edit, Trash2, X, Save, Loader2, Link2 } from 'lucide-react';

export function AdminCategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [categoryExamMappings, setCategoryExamMappings] = useState<Record<string, string[]>>({});
  const [formErrors, setFormErrors] = useState<{name?: string; description?: string; exams?: string}>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [categoryList, examList] = await Promise.all([
        api.adminGetCategories(),
        api.adminGetExams()
      ]);
      setCategories(categoryList);
      setExams(examList);
      
      // Load exam mappings for each category
      const mappings: Record<string, string[]> = {};
      for (const category of categoryList) {
        try {
          // Get exams that have this category
          const examIds: string[] = [];
          for (const exam of examList) {
            const examCategories = await api.adminGetExamCategories(exam.id);
            if (examCategories.some((c: Category) => c.id === category.id)) {
              examIds.push(exam.id);
            }
          }
          mappings[category.id] = examIds;
        } catch (err) {
          mappings[category.id] = [];
        }
      }
      setCategoryExamMappings(mappings);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoryList = await api.adminGetCategories();
      setCategories(categoryList);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setSelectedExams([]);
    setFormErrors({});
    setError('');
    setShowForm(true);
  };

  const handleEdit = async (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description
    });
    setFormErrors({});
    setError('');
    
    // Load current exam mappings for this category
    try {
      const examIds: string[] = [];
      for (const exam of exams) {
        const examCategories = await api.adminGetExamCategories(exam.id);
        if (examCategories.some((c: Category) => c.id === category.id)) {
          examIds.push(exam.id);
        }
      }
      setSelectedExams(examIds);
    } catch (err) {
      setSelectedExams([]);
    }
    
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    const errors: {name?: string; description?: string; exams?: string} = {};
    
    // Validate name
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    }
    
    // Validate description
    if (!formData.description || formData.description.trim() === '') {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 5) {
      errors.description = 'Description must be at least 5 characters';
    }
    
    // Validate at least one exam is selected
    if (selectedExams.length === 0) {
      errors.exams = 'Please select at least one exam for this category';
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
      let categoryId: string;
      
      if (editingCategory) {
        await api.adminUpdateCategory(editingCategory.id, formData);
        categoryId = editingCategory.id;
      } else {
        const response = await api.adminCreateCategory(formData);
        categoryId = response.id || response.category?.id || editingCategory?.id || '';
        if (!categoryId) {
          throw new Error('Failed to get category ID from response');
        }
      }
      
      // Update exam-category mappings
      // First, remove category from all exams
      for (const exam of exams) {
        const examCategories = await api.adminGetExamCategories(exam.id);
        const hasCategory = examCategories.some((c: Category) => c.id === categoryId);
        
        if (hasCategory && !selectedExams.includes(exam.id)) {
          // Remove category from this exam
          await api.adminRemoveExamCategory(exam.id, categoryId);
        } else if (!hasCategory && selectedExams.includes(exam.id)) {
          // Add category to this exam
          await api.adminAddExamCategory(exam.id, categoryId);
        }
      }
      
      setShowForm(false);
      setFormErrors({});
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    }
  };

  const toggleExamSelection = (examId: string) => {
    setSelectedExams(prev => {
      const newSelection = prev.includes(examId)
        ? prev.filter(id => id !== examId)
        : [...prev, examId];
      
      // Clear error when selection changes
      if (formErrors.exams && newSelection.length > 0) {
        setFormErrors({ ...formErrors, exams: undefined });
      }
      
      return newSelection;
    });
  };

  const handleDelete = async (categoryId: string) => {
    try {
      // Get deletion impact
      const impact = await api.adminGetCategoryDeletionImpact(categoryId);
      
      // Build warning message
      const warnings: string[] = [];
      const info: string[] = [];
      
      if (impact.exam_mappings_to_remove > 0) {
        warnings.push(`• ${impact.exam_mappings_to_remove} exam mapping(s) will be removed`);
        if (impact.exams_using_category && impact.exams_using_category.length > 0) {
          const examNames = impact.exams_using_category.map((e: any) => e.name).join(', ');
          info.push(`  (Exams affected: ${examNames})`);
        }
        info.push(`  (Exams will remain, only mappings will be removed)`);
      }
      
      if (impact.questions_count > 0) {
        warnings.push(`• ${impact.questions_count} question(s) are associated with this category`);
        info.push(`  (Questions will NOT be deleted - they will remain in the database)`);
        info.push(`  (Consider archiving or reassigning questions before deletion)`);
      }
      
      const warningMsg = warnings.length > 0
        ? `⚠️ WARNING: Deleting "${impact.category_name}"\n\n${warnings.join('\n')}\n\n${info.join('\n')}\n\nIMPORTANT:\n• Questions will NOT be deleted\n• Exams will NOT be deleted\n• Only exam-category mappings will be removed\n\n⚠️ This action cannot be undone. Are you sure you want to proceed?`
        : `Are you sure you want to delete "${impact.category_name}"?\n\nNote: Questions will remain unchanged.`;
      
      if (!confirm(warningMsg)) return;
      
      setError('');
      try {
        await api.adminDeleteCategory(categoryId);
        loadData();
      } catch (deleteErr: any) {
        // If deletion fails due to questions, show specific error
        const errorMsg = deleteErr.message || deleteErr.error?.message || 'Failed to delete category';
        if (errorMsg.includes('question') || errorMsg.includes('Questions are never deleted')) {
          setError(`⚠️ ${errorMsg}\n\nCategories with questions cannot be deleted. Questions are preserved in the database.`);
        } else {
          setError(errorMsg);
        }
        throw deleteErr; // Re-throw to prevent further execution
      }
    } catch (err: any) {
      // Error already handled above
      if (!err.message?.includes('question')) {
        setError(err.message || 'Failed to delete category');
      }
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Category Management</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add Category</span>
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
              {editingCategory ? 'Edit Category' : 'Create Category'}
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
                placeholder="e.g., Current Affairs, History"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: undefined });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Category description"
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Exams *
              </label>
              <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${
                formErrors.exams ? 'border-red-500' : 'border-gray-300'
              }`}>
                {exams.length === 0 ? (
                  <p className="text-sm text-gray-500">No exams available</p>
                ) : (
                  <div className="space-y-2">
                    {exams.map((exam) => (
                      <label
                        key={exam.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedExams.includes(exam.id)}
                          onChange={() => toggleExamSelection(exam.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{exam.name}</span>
                        {exam.category && (
                          <span className="text-xs text-gray-500">({exam.category})</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formErrors.exams ? (
                <p className="mt-1 text-sm text-red-600">{formErrors.exams}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Select which exams this category should be available for
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
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exams
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                const mappedExams = categoryExamMappings[category.id] || [];
                const examNames = mappedExams
                  .map(examId => exams.find(e => e.id === examId)?.name)
                  .filter(Boolean)
                  .join(', ') || 'None';
                
                return (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Link2 className="w-4 h-4 text-gray-400" />
                        <span className="max-w-xs truncate" title={examNames}>
                          {examNames}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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


