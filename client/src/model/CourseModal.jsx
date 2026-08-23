// src/components/CourseModal.jsx
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify"; // Explicit import for toast

function CourseModal({ course, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: course.name,
    isFree: course.isFree,
    isPublic: course.isPublic,
    duration: course.duration || "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     await onSave(course._id, formData);
  //     onClose();
  //     toast.success("Course updated successfully!");
  //   } catch (error) {
  //     console.error('Submit error:', error);
  //      toast.error("Failed to update course!");
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting:', { courseId: course._id, formData });
      await onSave(course._id, formData);
      console.log('Update succeeded');
      onClose();
      toast.success("Course updated successfully!");
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(`Failed to update course: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700/50 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Edit Course</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-200 text-sm mb-1">Course Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-md p-2"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFree"
              checked={formData.isFree}
              onChange={handleChange}
              className="h-4 w-4 text-cyan-600 bg-gray-800 border-gray-700 rounded"
            />
            <label className="text-gray-200 text-sm">Free Course</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="h-4 w-4 text-cyan-600 bg-gray-800 border-gray-700 rounded"
            />
            <label className="text-gray-200 text-sm">Public Course</label>
          </div>
          <div>
            <label className="block text-gray-200 text-sm mb-1">Duration</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-md p-2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-all duration-300"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default CourseModal;