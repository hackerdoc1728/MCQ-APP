export function adminHostOnly(req, res, next) {
    if (process.env.NODE_ENV === "production") {
        if (req.hostname !== "admin.benchtobedsideneuro.com") {
            return res.status(404).send("Not found");
        }
    }
    next();
}
