import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SEO from '@/components/SEO';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { BlogPost } from '@/types/blog';
import Link from 'next/link';

export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [recentBlogs, setRecentBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      try {
        const q = query(
          collection(db, "blogs"),
          where("slug", "==", slug),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setBlog(snapshot.docs[0].data() as BlogPost);
          
          // Fetch recent blogs for the sidebar
          const recentQ = query(
            collection(db, "blogs"),
            where("published", "==", true)
          );
          const recentSnapshot = await getDocs(recentQ);
          const allRecent = recentSnapshot.docs.map(doc => doc.data() as BlogPost);
          // Filter out the current blog and limit to 4
          const filteredRecent = allRecent
            .filter(b => b.slug !== slug)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4);
            
          setRecentBlogs(filteredRecent);
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <main className="flex-grow pt-28 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <main className="flex-grow pt-32 px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Post Not Found</h1>
          <p className="text-gray-500 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link href="/blog" className="bg-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-600 transition">
            Back to Journal
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Head>
        <title>{blog.title} | Jyoti Mehndi</title>
        <meta name="description" content={blog.excerpt || `Read about ${blog.title}`} />
      </Head>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <article className="bg-white rounded-3xl shadow-xl overflow-hidden border border-pink-50">
          <div className="text-center py-12 md:py-16 px-4 md:px-10">
            <div className="inline-block px-4 py-1.5 rounded-full bg-pink-50 text-xs font-bold text-pink-500 uppercase tracking-widest mb-6">
              Wedding Journal
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-8">
              {blog.title}
            </h1>
            <div className="flex items-center justify-center space-x-6 text-gray-500 font-medium">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                By {blog.author}
              </div>
            </div>
          </div>

          {blog.coverImage && (
            <div className="mb-12 rounded-t-none rounded-b-3xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-50 aspect-[16/9] md:aspect-[2/1] relative group">
              <div className="absolute inset-0 bg-pink-500/10 group-hover:bg-transparent transition duration-500 z-10"></div>
              <img 
                src={blog.coverImage} 
                alt={blog.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
              />
            </div>
          )}

          <div className="prose prose-lg md:prose-xl max-w-none text-gray-700 px-4 md:px-12 pb-8 space-y-6">
            {blog.blocks?.map((block) => {
              if (block.type === "text") {
                const isHeading = block.value.startsWith("### ");
                const isListItem = block.value.startsWith("- ");
                
                if (isHeading) {
                  return (
                    <h3 key={block.id} className="text-2xl md:text-3xl font-black text-gray-900 mt-12 mb-6 tracking-tight flex items-center">
                      <span className="w-8 h-1 bg-pink-500 rounded-full mr-4 inline-block"></span>
                      {block.value.replace("### ", "")}
                    </h3>
                  );
                }

                if (isListItem) {
                  const items = block.value.split("\n").filter(i => i.startsWith("- "));
                  return (
                    <ul key={block.id} className="space-y-3 my-6 pl-4 md:pl-8">
                      {items.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg className="w-6 h-6 mr-3 text-pink-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="leading-relaxed">{item.replace("- ", "")}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                // Parse bold texts **text** manually with a simple regex for standard text
                const formattedText = block.value.split(/(\*\*.*?\*\*)/g).map((part, index) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="text-gray-900 font-bold">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                });

                return (
                  <p key={block.id} className="whitespace-pre-wrap leading-loose text-lg md:text-xl text-gray-600">
                    {formattedText}
                  </p>
                );
              }

              if (block.type === "image" && block.value) {
                return (
                  <figure key={block.id} className="my-12">
                    <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                      <img 
                        src={block.value} 
                        alt="Blog visual" 
                        className="w-full h-auto bg-gray-50 max-h-[600px] object-cover hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </figure>
                );
              }
              return null;
            })}
          </div>

          <div className="mt-8 px-6 md:px-12 pb-8 border-t border-gray-100 flex justify-between items-center pt-8">
            <Link href="/blog" className="text-pink-500 font-bold hover:text-pink-600 flex items-center transition group">
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to all posts
            </Link>
          </div>
        </article>
      </div>

      {/* Sidebar: Recent Posts */}
      <aside className="lg:col-span-1">
        <div className="sticky top-28 bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
            <span className="w-4 h-4 rounded-full bg-pink-500 mr-3"></span>
            More Articles
          </h3>
          
          <div className="space-y-6">
            {recentBlogs.length > 0 ? (
              recentBlogs.map((recentBlog) => (
                <Link href={`/blog/${recentBlog.slug}`} key={recentBlog.id} className="group flex items-start gap-4 p-2 -m-2 rounded-2xl hover:bg-pink-50/50 transition">
                  <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img 
                      src={recentBlog.coverImage} 
                      alt={recentBlog.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-pink-500 transition-colors mb-1 leading-snug">
                      {recentBlog.title}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      {new Date(recentBlog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">No other articles available right now.</p>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="bg-pink-50 rounded-2xl p-6 text-center">
              <h4 className="font-bold text-gray-900 mb-2">Book Your Mehndi</h4>
              <p className="text-sm text-gray-600 mb-4">Make your big day truly unforgettable.</p>
              <Link href="/#services" className="inline-block bg-pink-500 text-white text-sm font-bold py-2 px-6 rounded-full shadow-md hover:bg-pink-600 transition hover:-translate-y-0.5">
                View Packages
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </main>


    </div>
  );
}
