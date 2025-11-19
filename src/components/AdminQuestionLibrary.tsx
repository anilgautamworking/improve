import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { BookOpen, FileText, BarChart3, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export function AdminQuestionLibrary() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.adminGetQuestionLibraryStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load question library statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.total_questions || 0}
              </p>
            </div>
            <BookOpen className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Articles</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.total_articles || 0}
              </p>
            </div>
            <FileText className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orphaned Categories</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.orphaned_categories_count || 0}
              </p>
              {stats.orphaned_categories_count > 0 && (
                <p className="text-xs text-amber-600 mt-1">Categories not assigned to any exam</p>
              )}
            </div>
            <AlertTriangle className="w-12 h-12 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Questions by Category Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Questions by Category</h3>
        </div>
        {stats.questions_by_category && stats.questions_by_category.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.questions_by_category}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category_name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="question_count" fill="#3b82f6" name="Questions" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No category data available
          </div>
        )}
      </div>

      {/* Questions by Exam Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Questions by Exam</h3>
        </div>
        {stats.questions_by_exam && stats.questions_by_exam.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.questions_by_exam}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="exam_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="question_count" fill="#8b5cf6" name="Questions" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No exam data available
          </div>
        )}
      </div>

      {/* Category Distribution Pie Chart */}
      {stats.questions_by_category && stats.questions_by_category.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={stats.questions_by_category.filter((item: any) => item.question_count > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category_name, question_count, percent }) => 
                  `${category_name}: ${question_count} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="question_count"
                nameKey="category_name"
              >
                {stats.questions_by_category.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Tables for Future Extensibility */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.questions_by_category && stats.questions_by_category.length > 0 ? (
                  stats.questions_by_category.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {item.question_count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exam Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Exam Breakdown</h3>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.questions_by_exam && stats.questions_by_exam.length > 0 ? (
                  stats.questions_by_exam.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.exam_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {item.question_count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Orphaned Categories Section */}
      {stats.orphaned_categories && stats.orphaned_categories.length > 0 && (
        <div className="bg-amber-50 rounded-lg shadow border border-amber-200">
          <div className="px-6 py-4 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Orphaned Categories</h3>
              <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                {stats.orphaned_categories_count}
              </span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              These categories are not associated with any exam. They may have been orphaned after exam deletion.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-200">
              <thead className="bg-amber-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-amber-800 uppercase tracking-wider">
                    Questions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-amber-200">
                {stats.orphaned_categories.map((category: any) => (
                  <tr key={category.category_id} className="hover:bg-amber-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.category_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {category.question_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-amber-100 border-t border-amber-200">
            <p className="text-xs text-amber-800">
              💡 Tip: You can assign these categories to exams from the Categories tab to make them accessible.
            </p>
          </div>
        </div>
      )}

      {/* Future Extensibility Section */}
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Future Enhancements</h3>
        <p className="text-sm text-gray-600 mb-4">
          This section is reserved for future features such as:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Question quality metrics</li>
          <li>Article-to-question conversion rates</li>
          <li>Question usage analytics</li>
          <li>Category performance trends</li>
          <li>Exam-specific analytics</li>
        </ul>
      </div>
    </div>
  );
}

