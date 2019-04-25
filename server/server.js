const app = require("../app")
const config = require("config")
const logger = require("./startup/logger")

const port = process.env.PORT || config.get("PORT")

app.listen(port, () => {
	logger.info(`** listening on port ${port}.... 👂🏻`)
})
