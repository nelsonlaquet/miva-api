let $ = null

try {
	$ = require("gulp-util")
} catch (er) {
	// safely ignore, it wasn't installed...
}

export default $