import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { TopNav } from "@/components/layout/TopNav";
import { Link } from "wouter";
import {
  Loader2, Trash2, Eye, EyeOff, CheckCircle2, Clock,
  MapPin, AlertTriangle, Edit2, Plus, ClipboardList,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MyPost {
  id: number;
  postType: "need" | "offer";
  title: string;
  category: string;
  description: string;
  governorate: string;
  district: string | null;
  status: string;
  urgency: string | null;
  publicLat: number | null;
  publicLng: number | null;
  privateLat: number | null;
  privateLng: number | null;
  createdAt: string;
  expiresAt: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const API = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `Expired ${Math.abs(diff)}d ago`;
  if (diff === 0) return "Expires today";
  return `${diff}d left`;
}

function timeAgo(dateStr: string): string {
  const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:   { label: "Active",   color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Eye className="w-3.5 h-3.5" /> },
  hidden:   { label: "Hidden",   color: "bg-orange-50 text-orange-700 border-orange-200",   icon: <EyeOff className="w-3.5 h-3.5" /> },
  resolved: { label: "Resolved", color: "bg-blue-50 text-blue-700 border-blue-200",         icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  expired:  { label: "Expired",  color: "bg-slate-100 text-slate-500 border-slate-200",     icon: <Clock className="w-3.5 h-3.5" /> },
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-700 border-amber-200",      icon: <Clock className="w-3.5 h-3.5" /> },
  removed:  { label: "Removed",  color: "bg-red-50 text-red-600 border-red-200",            icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function MyPosts() {
  const { isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<MyPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<MyPost[]>("/posts/me");
      setPosts(data);
    } catch {
      toast({ title: "Failed to load your posts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated) fetchPosts();
  }, [isAuthenticated, fetchPosts]);

  const handleStatusChange = async (postId: number, status: "active" | "hidden" | "resolved") => {
    try {
      setActionLoading(postId);
      await apiFetch(`/posts/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast({ title: `Post marked as ${status}` });
      await fetchPosts();
    } catch {
      toast({ title: "Failed to update post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    try {
      setActionLoading(postId);
      await apiFetch(`/posts/${postId}`, { method: "DELETE" });
      toast({ title: "Post deleted" });
      await fetchPosts();
    } catch {
      toast({ title: "Failed to delete post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (post: MyPost) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditDescription(post.description);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      setActionLoading(editingPost.id);
      await apiFetch(`/posts/${editingPost.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      toast({ title: "Post updated successfully" });
      setEditingPost(null);
      await fetchPosts();
    } catch {
      toast({ title: "Failed to update post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Auth guard ───────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <TopNav showBack />
        <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 pt-20 px-4">
          <div className="text-center max-w-md">
            <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">My Posts</h1>
            <p className="text-slate-500 mb-6">Sign in to view and manage your listings.</p>
            <button
              onClick={openAuthModal}
              className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-lg"
            >
              Sign In
            </button>
          </div>
        </main>
      </>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────────

  return (
    <>
      <TopNav showBack title="My Posts" />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 sm:pt-28 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">My Posts</h1>
              <p className="text-sm text-slate-500 mt-1">
                {posts.length} {posts.length === 1 ? "listing" : "listings"}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/need/new"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all no-underline"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Need</span>
              </Link>
              <Link
                href="/offer/new"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all no-underline"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Offer</span>
              </Link>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty state */}
          {!loading && posts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-20 text-center"
            >
              <ClipboardList className="w-16 h-16 text-slate-200 mb-4" />
              <h2 className="text-xl font-bold text-slate-600 mb-2">No posts yet</h2>
              <p className="text-slate-400 mb-6 max-w-sm">
                Create your first listing to start helping or receiving help in your community.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/need/new"
                  className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 shadow-lg hover:opacity-90 transition-opacity no-underline"
                >
                  I Need Help
                </Link>
                <Link
                  href="/offer/new"
                  className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg hover:opacity-90 transition-opacity no-underline"
                >
                  I Want to Help
                </Link>
              </div>
            </motion.div>
          )}

          {/* Posts list */}
          {!loading && posts.length > 0 && (
            <div className="space-y-4">
              <AnimatePresence>
                {posts.map((post) => {
                  const statusInfo = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.active;
                  const isBeingActioned = actionLoading === post.id;

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* Card header */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase ${
                                  post.postType === "need"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-emerald-50 text-emerald-600"
                                }`}
                              >
                                {post.postType}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">{post.category}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${statusInfo.color}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-base sm:text-lg truncate">{post.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{post.description}</p>
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {post.governorate}{post.district ? `, ${post.district}` : ""}
                          </span>
                          <span>Created {timeAgo(post.createdAt)}</span>
                          <span>{daysUntil(post.expiresAt)}</span>
                        </div>
                      </div>

                      {/* Actions bar */}
                      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-slate-50/80 border-t border-slate-100">
                        <button
                          onClick={() => startEdit(post)}
                          disabled={isBeingActioned}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-40"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {post.status === "active" && (
                          <button
                            onClick={() => handleStatusChange(post.id, "hidden")}
                            disabled={isBeingActioned}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-40"
                          >
                            {isBeingActioned ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                            Hide
                          </button>
                        )}
                        {post.status === "hidden" && (
                          <button
                            onClick={() => handleStatusChange(post.id, "active")}
                            disabled={isBeingActioned}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                          >
                            {isBeingActioned ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                            Show
                          </button>
                        )}
                        {(post.status === "active" || post.status === "hidden") && (
                          <button
                            onClick={() => handleStatusChange(post.id, "resolved")}
                            disabled={isBeingActioned}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                          >
                            {isBeingActioned ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Resolved
                          </button>
                        )}
                        <div className="flex-1" />
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={isBeingActioned}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {isBeingActioned ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Edit modal */}
      <AnimatePresence>
        {editingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setEditingPost(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">Edit Post</h2>
                <p className="text-sm text-slate-400 mt-0.5">Update your listing details</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm resize-none"
                    maxLength={1000}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading === editingPost.id || editTitle.length < 3 || editDescription.length < 10}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity disabled:opacity-40 shadow"
                >
                  {actionLoading === editingPost.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
