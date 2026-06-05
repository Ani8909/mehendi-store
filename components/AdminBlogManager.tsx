import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiType, FiEye, FiCheck, FiX } from 'react-icons/fi';
import { compressImage } from '@/lib/imageUtils';
import { BlogPost, BlogBlock } from '@/types/blog';

export default function AdminBlogManager() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const q = query(collection(db, "blogs"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
      // sort by date descending
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBlogs(data);
    } catch (err) {
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleCreateNew = () => {
    setEditingBlog({
      id: Date.now().toString(),
      title: '',
      slug: '',
      coverImage: '',
      excerpt: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Admin',
      published: false,
      blocks: []
    });
  };

  const handleSave = async () => {
    if (!editingBlog) return;
    if (!editingBlog.title || !editingBlog.coverImage) {
      alert("Title and Cover Image are required");
      return;
    }

    try {
      const slug = generateSlug(editingBlog.title);
      const blogToSave = {
        ...editingBlog,
        slug: editingBlog.slug || slug,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, "blogs", blogToSave.id), blogToSave);
      alert("Blog saved successfully!");
      setEditingBlog(null);
      fetchBlogs();
    } catch (err: any) {
      alert("Error saving blog: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    try {
      await deleteDoc(doc(db, "blogs", id));
      fetchBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (file: File, type: "cover" | "block", blockId?: string) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large (max 10MB).");
      return;
    }
    
    setIsUploading(true);
    try {
      const compressedBase64 = await compressImage(file, 1920, 0.7);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedBase64 }),
      });
      
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      if (type === "cover" && editingBlog) {
        setEditingBlog({ ...editingBlog, coverImage: data.url });
      } else if (type === "block" && blockId && editingBlog) {
        setEditingBlog({
          ...editingBlog,
          blocks: editingBlog.blocks.map(b => b.id === blockId ? { ...b, value: data.url } : b)
        });
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const addBlock = (type: "text" | "image") => {
    if (!editingBlog) return;
    setEditingBlog({
      ...editingBlog,
      blocks: [...editingBlog.blocks, { id: Date.now().toString(), type, value: '' }]
    });
  };

  const removeBlock = (id: string) => {
    if (!editingBlog) return;
    setEditingBlog({
      ...editingBlog,
      blocks: editingBlog.blocks.filter(b => b.id !== id)
    });
  };

  const updateBlockValue = (id: string, value: string) => {
    if (!editingBlog) return;
    setEditingBlog({
      ...editingBlog,
      blocks: editingBlog.blocks.map(b => b.id === id ? { ...b, value } : b)
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading blogs...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Blog Manager</h2>
        {!editingBlog && (
          <button 
            onClick={handleCreateNew}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-pink-600 transition"
          >
            <FiPlus /> Create New Blog
          </button>
        )}
      </div>

      {editingBlog ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-700">
              {editingBlog.id.length > 13 ? "Edit Blog" : "New Blog"}
            </h3>
            <div className="flex gap-3">
              <button onClick={() => setEditingBlog(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl transition">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isUploading}
                className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl font-medium hover:bg-pink-600 transition disabled:opacity-50"
              >
                Save Blog
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title</label>
                <input 
                  type="text" 
                  value={editingBlog.title}
                  onChange={(e) => setEditingBlog({...editingBlog, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                  placeholder="E.g., Top 10 Bridal Mehndi Designs for 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Excerpt</label>
                <textarea 
                  value={editingBlog.excerpt}
                  onChange={(e) => setEditingBlog({...editingBlog, excerpt: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 h-24 resize-none focus:ring-[var(--color-primary)] outline-none"
                  placeholder="A short summary for the blog card..."
                />
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-700">Content Blocks</h4>
                  <div className="flex gap-2">
                    <button onClick={() => addBlock("text")} className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm hover:border-[var(--color-primary)] transition">
                      <FiType /> Add Text
                    </button>
                    <button onClick={() => addBlock("image")} className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm hover:border-[var(--color-primary)] transition">
                      <FiImage /> Add Image
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {editingBlog.blocks.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                      No content blocks yet. Add text or images.
                    </div>
                  )}
                  {editingBlog.blocks.map((block, index) => (
                    <div key={block.id} className="relative bg-white border border-gray-200 rounded-xl p-4 group">
                      <button 
                        onClick={() => removeBlock(block.id)}
                        className="absolute -top-3 -right-3 bg-white border border-red-100 text-red-500 p-1.5 rounded-full hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition"
                      >
                        <FiTrash2 size={14} />
                      </button>
                      
                      {block.type === "text" ? (
                        <textarea 
                          value={block.value}
                          onChange={(e) => updateBlockValue(block.id, e.target.value)}
                          className="w-full border-none focus:ring-0 resize-y min-h-[100px] outline-none"
                          placeholder="Type your paragraph here..."
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          {block.value ? (
                            <img src={block.value} alt="Block" className="max-h-[300px] object-contain rounded-lg mb-3" />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 mb-3">
                              <FiImage size={24} className="text-gray-400 mb-2" />
                              <span className="text-sm text-gray-500">Upload Image Block</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "block", block.id);
                            }}
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-[var(--color-primary)] hover:file:bg-pink-100 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-bold text-gray-700 mb-3">Publishing</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${editingBlog.published ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`} onClick={() => setEditingBlog({...editingBlog, published: !editingBlog.published})}>
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                  <span className={`font-medium ${editingBlog.published ? 'text-green-600' : 'text-gray-500'}`}>
                    {editingBlog.published ? "Published (Live)" : "Draft (Hidden)"}
                  </span>
                </label>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-bold text-gray-700 mb-3">Cover Image</h4>
                {editingBlog.coverImage ? (
                  <div className="relative mb-3">
                    <img src={editingBlog.coverImage} alt="Cover" className="w-full h-40 object-cover rounded-xl" />
                    <button 
                      onClick={() => setEditingBlog({...editingBlog, coverImage: ''})}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-3 text-gray-400">
                    <FiImage size={24} className="mb-2" />
                    <span className="text-sm">No Cover Image</span>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "cover");
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-[var(--color-primary)] hover:file:bg-pink-100 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 rounded-tl-xl font-medium">Blog</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 rounded-tr-xl font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 border-b border-gray-100">
                    No blogs found. Click "Create New Blog" to start writing!
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={blog.coverImage || 'https://via.placeholder.com/150'} alt="Cover" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                        <div>
                          <p className="font-bold text-gray-800 line-clamp-1">{blog.title}</p>
                          <p className="text-xs text-gray-500">/{blog.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${blog.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingBlog(blog)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                          <FiEdit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(blog.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
