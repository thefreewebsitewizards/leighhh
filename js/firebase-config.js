// Firebase CDN Configuration for Leigh Lusignan Website
// Uses Firebase compat SDK loaded via CDN in HTML files

const STORE_ID = "leigh-blogs";

const firebaseConfig = {
    apiKey: "AIzaSyCqAoxETs_gyv_HWVa6O1jx0nCFZfRBdQA",
    authDomain: "multi-tanent-projects.firebaseapp.com",
    projectId: "multi-tanent-projects",
    storageBucket: "multi-tanent-projects.firebasestorage.app",
    messagingSenderId: "994746165516",
    appId: "1:994746165516:web:7a2422e6ad6b0d3c41c129"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const functions = firebase.functions();

/**
 * Wrapper for Cloud Functions — automatically injects storeId
 */
async function callFunction(functionName, data = {}) {
    try {
        const fn = functions.httpsCallable(functionName);
        const response = await fn({ ...data, storeId: STORE_ID });
        return response.data;
    } catch (error) {
        console.error(`Error calling ${functionName}:`, error);
        throw error;
    }
}

/**
 * Get all published posts ordered by date
 */
function getPublishedPosts(callback) {
    return db.collection('stores').doc(STORE_ID).collection('posts')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const posts = [];
            snapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
            callback(posts.filter(post => post.status === 'published'));
        }, error => {
            console.error('Error fetching posts:', error);
            callback([]);
        });
}

/**
 * Get all posts (for admin — includes drafts)
 */
function getAllPosts(callback) {
    return db.collection('stores').doc(STORE_ID).collection('posts')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const posts = [];
            snapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
            callback(posts);
        }, error => {
            console.error('Error fetching posts:', error);
            callback([]);
        });
}

/**
 * Get single post by ID
 */
function getPost(postId, callback) {
    return db.collection('stores').doc(STORE_ID).collection('posts')
        .doc(postId)
        .onSnapshot(doc => {
            if (doc.exists) {
                callback(doc.data());
            } else {
                callback(null);
            }
        });
}

/**
 * Get comments for a post
 */
function getComments(postId, callback) {
    return db.collection('stores').doc(STORE_ID).collection('comments')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const comments = [];
            snapshot.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));
            callback(comments.filter(comment => comment.postId === postId && (comment.type || 'comment') === 'comment'));
        }, error => {
            console.error('Error fetching comments:', error);
            callback([]);
        });
}

/**
 * Get all testimonies/community comments
 */
function getTestimonies(callback) {
    return db.collection('stores').doc(STORE_ID).collection('comments')
        .where('type', '==', 'testimony')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const items = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
            callback(items);
        }, error => {
            console.error('Error fetching testimonies:', error);
            callback([]);
        });
}

/**
 * Add a comment (public — no auth required)
 */
async function addComment(commentData) {
    const ref = db.collection('stores').doc(STORE_ID).collection('comments').doc();
    await ref.set({
        ...commentData,
        id: ref.id,
        storeId: STORE_ID,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return ref.id;
}

/**
 * Format date string
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = typeof dateStr.toDate === 'function'
        ? dateStr.toDate()
        : new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Truncate text to excerpt
 */
function truncateText(text, maxLength = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}
