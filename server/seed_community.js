const axios = require('axios');

const API_URL = 'http://localhost:5000/api/community';

const posts = [
    {
        author: "Ramesh Kumar",
        content: "Has anyone tried the new organic fertilizer for wheat? I'm seeing mixed results in my field.",
        avatar: "RK"
    },
    {
        author: "Lakshmi Devi",
        content: "Be careful with the heavy rains predicted for next week in Karnataka. Ensure proper drainage in your tomato fields.",
        avatar: "LD"
    },
    {
        author: "Suresh Patel",
        content: "I'm looking for a good dealer for drip irrigation pipes near Surat. Any recommendations?",
        avatar: "SP"
    }
];

const seed = async () => {
    console.log("Seeding community forum...");
    for (const post of posts) {
        try {
            await axios.post(API_URL, post);
            console.log(`Posted: ${post.content.substring(0, 30)}...`);
        } catch (error) {
            console.error(`Failed to post: ${error.message}`);
            if (error.code === 'ECONNREFUSED') {
                console.error("Make sure the server is running on port 5000!");
                process.exit(1);
            }
        }
    }
    console.log("Seeding complete!");
};

seed();
