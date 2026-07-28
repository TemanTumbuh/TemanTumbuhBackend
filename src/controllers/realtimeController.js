import RealtimeService from "../services/realtimeService.js";

const RealtimeController = {
    getConfig(req, res) {
        const config = RealtimeService.getChannelConfig();
        return res.status(200).json({ success: true, data: config });
    },
};

export default RealtimeController;
