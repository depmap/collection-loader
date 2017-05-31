const path = require('path')
const fs = require('fs')
const mkdirp = require('make-dir')

module.exports = (opts) => {
	opts.dependsOn = Array.isArray(opts.dependsOn) ? opts.dependsOn : [opts.dependsOn]
	opts.dependents = Array.isArray(opts.dependents) ? opts.dependents : [opts.dependents]
  opts.collectionKeys = Array.isArray(opts.collectionKeys) ? opts.collectionKeys : [opts.collectionKeys]
  opts.stateless = opts.stateless ? opts.stateless : false

  const map = {}
  for (let file in opts.files) {
    let filepath = path.join(process.cwd(), file)
		let data
		try {
			data = require(filepath)
		} catch (err) {
			if (err.message.indexOf('Cannot find module') > -1)
				console.warn(`${file} was not found - fetching new posts...`)

			data = opts.fetch()
			mkdirp.sync(path.dirname(filepath))
			fs.writeFileSync(filepath, data)
		}
		let location = opts.files[file]

    for (let collection in data[location]) {
      let filename = `${file}[${collection}]`

      map[filename] = {
				dependents: opts.dependents,
        dependsOn: opts.dependsOn,
        onUpdate: function(filename, cfg, depmap) {
					console.log(filename)
					let data = {}
					if (typeof filename === 'string') {
						data = depmap[filename].data
					} else { // filename is locals
						data = filename
					}
					opts.onUpdate(data)
				}
      }

      if (!opts.stateless) map[filename].data = data[location][collection]
    }
  }

  return { 
    meta: {
      ext: '.json',
      outExt: opts.outExt
    },
    map
  }
}
