'use strict'
const Hapi = require('hapi')
const fs = require('fs')

const server = new Hapi.Server()
server.connection({
  // required for Heroku
  port: process.env.PORT || 8080
})

server.register(require('inert'), (err) => {

  if (err) throw err

  // customized https://gist.github.com/joyrexus/0c6bd5135d7edeba7b87
  server.route({
    method: 'POST',
    path: '/upload',
    config: {
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data'
      },
      handler: function(request, reply) {
        var data = request.payload
        if (data.file) {
          var name = data.file.hapi.filename;
          var path = __dirname + name;
          var file = fs.createWriteStream(path);

          file.on('error', function(err) {
            console.error(err)
          });

          data.file.pipe(file);

          data.file.on('end', function(err) {
            fs.stat(path, function(err, stats) {
              var ret = {
                filename: data.file.hapi.filename,
                "content-type": data.file.hapi.headers['content-type'],
                size: stats.size
              }
              reply(ret);
            })
          })
        }
      }
    }
  });
  
  server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
      reply.file('./index.html')
    }
  })

  server.start(() => console.log('Started'))
})
