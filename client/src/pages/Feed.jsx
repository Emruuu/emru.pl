import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import Post from "../components/Post";
import NewPostForm from "../components/NewPostForm";

const API_URL = import.meta.env.VITE_API_URL;

function Feed() {
    const [posts, setPosts] = useState([]);
    const { user } = useUser();

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/messages`);
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error("Błąd pobierania postów:", err);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <Layout>
            <h2 style={{ textAlign: "center" }}>Posty społeczności</h2>
            {user && <NewPostForm onPostAdded={fetchPosts} />}
            {posts.length === 0 ? (
                <p style={{ textAlign: "center" }}>Brak postów.</p>
            ) : (
                posts.map((post) => (
                    <Post key={post.id} post={post} onCommentAdded={fetchPosts} />
                ))
            )}
        </Layout>
    );
}

export default Feed;
