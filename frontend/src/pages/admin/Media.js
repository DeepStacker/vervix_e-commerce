import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUpload,
  FiTrash2,
  FiImage,
  FiVideo,
  FiFile,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiEye,
  FiDownload,
  FiMoreVertical
} from 'react-icons/fi';
import adminApi from '../../api/adminApi';
import toast from 'react-hot-toast';

const AdminMedia = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showPreview, setShowPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load media files on component mount
  useEffect(() => {
    loadMediaFiles();
  }, []);

  const loadMediaFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.get('/admin/media/files');
      setMediaFiles(response.data.files || []);
    } catch (err) {
      setError('Failed to load media files. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await adminApi.post('/admin/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMediaFiles(prev => [response.data.file, ...prev]);
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileName) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await adminApi.delete(`/admin/media/delete/${fileName}`);
      setMediaFiles(prev => prev.filter(file => file.fileName !== fileName));
      toast.success('File deleted successfully!');
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error(error.response?.data?.message || 'Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) {
      toast.error('Please select files to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`)) {
      return;
    }

    const deletePromises = Array.from(selectedFiles).map(fileName => 
      adminApi.delete(`/admin/media/delete/${fileName}`)
    );

    try {
      await Promise.all(deletePromises);
      setMediaFiles(prev => prev.filter(file => !selectedFiles.has(file.fileName)));
      setSelectedFiles(new Set());
      toast.success(`${selectedFiles.size} file(s) deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete files:', error);
      toast.error('Failed to delete some files');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading media files...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!mediaFiles || mediaFiles.length === 0) return <div className="p-8 text-center text-gray-500">No media files found.</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Media Management</h1>
      <form onSubmit={handleUpload} className="flex items-center space-x-4 mb-4 p-4 bg-white rounded shadow">
        <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
        <button
          type="submit"
          className="bg-luxury-gold text-white px-6 py-2 rounded hover:bg-gold-dark transition"
        >
          Upload
        </button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {mediaFiles.map(file => (
          <div key={file.name} className="bg-white rounded shadow p-4 flex flex-col items-center">
            {file.url && file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={file.url} alt={file.name} className="w-32 h-32 object-cover mb-2 rounded" />
            ) : (
              <span className="text-gray-400">{file.name}</span>
            )}
            <p className="text-sm mt-2 mb-4">{file.name}</p>
            <button
              onClick={() => handleDelete(file.name)}
              className="text-red-600 text-xs hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMedia; 