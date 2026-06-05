import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import SEO from '@/components/SEO';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { BlogPost } from '@/types/blog';
import Link from 'next/link';

export default function BlogIndex() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const q = query(
          collection(db, "blogs"),
          where("published", "==", true)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data() as BlogPost);
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBlogs(data);
      } catch (err) {
        console.error("Error fetching blogs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Head>
        <title>Blog | Jyoti Mehndi Artist</title>
        <meta name="description" content="Read our latest updates, mehndi designs, tips, and tutorials." />
      </Head>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 mt-16 relative">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 left-0 -ml-20 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="text-center mb-20 relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-pink-50 text-xs font-bold text-pink-500 uppercase tracking-widest mb-4 border border-pink-100">
            Inspire Your Big Day
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">Journal</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
            Discover the latest trends, tips, and beautiful mehndi designs crafted with love and passion for your unforgettable moments.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-3xl h-96 shadow-sm"></div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Posts Yet</h3>
            <p className="text-gray-500">Check back soon for new articles and designs!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map(blog => (
              <Link href={`/blog/${blog.slug}`} key={blog.id} className="group h-full">
                <div className="bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 border border-gray-100 h-full flex flex-col transform group-hover:-translate-y-2 group-hover:scale-[1.02]">
                  <div className="relative h-72 overflow-hidden bg-gray-50">
                    <img 
                      src={blog.coverImage} 
                      alt={blog.title} 
                      className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-pink-500 shadow-md">
                      {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow relative bg-white">
                    <div className="absolute -top-6 right-8 w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                    
                    <h2 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-pink-500 transition-colors line-clamp-2 leading-snug">
                      {blog.title}
                    </h2>
                    <p className="text-gray-600 text-base mb-8 line-clamp-3 flex-grow leading-relaxed">
                      {blog.excerpt || "Read more about this beautiful mehndi design and get inspired."}
                    </p>
                    
                    <div className="flex items-center text-sm font-bold text-pink-500 mt-auto">
                      <span className="uppercase tracking-wider">Read Full Story</span>
                      <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>


    </div>
  );
}
