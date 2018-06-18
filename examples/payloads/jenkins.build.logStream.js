const log = jenkins.build.logStream('example', 1);

log.on('data', function(text) {
  process.stdout.write(text);
});

log.on('error', function(err) {
  console.log('error', err);
});

log.on('end', function() {
  console.log('end');
});
