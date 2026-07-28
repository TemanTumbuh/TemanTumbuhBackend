const RealtimeService = {
    getChannelConfig() {
        return {
            supabaseUrl: process.env.DATABASE_URL,
            supabaseKey: process.env.DATABASE_KEY,
            channels: {
                likes: {
                    table: "likes",
                    events: ["INSERT", "DELETE"],
                    broadcast: true,
                },
                comments: {
                    table: "comments",
                    events: ["INSERT", "DELETE"],
                    broadcast: true,
                },
            },
        };
    },
};

export default RealtimeService;
