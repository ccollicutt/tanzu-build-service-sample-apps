const express = require('express');
const port = process.env.PORT || 8080;
// If running in kubernetes, provide proxy location in env variable
const wavefrontProxy = process.env.WAVEFRONT_PROXY || "localhost"
const metrics = require('wavefrontmetrics');
const registry = new metrics.Registry();
// Report to a Wavefront proxy
const proxyReporter = new metrics.WavefrontProxyReporter(registry, "wavefront.nodejs.proxy", wavefrontProxy, 2878, { "tag0": "default", "source": "tbs-sample-app-nodejs"});
proxyReporter.start(5000);

const app = express();

app.get('/', (request, response) => {
  // Counter with metric level tags
  c.inc();

  response.send(`<!DOCTYPE html>
<html>
  <head>
    <title>Powered By Paketo Buildpacks</title>
  </head>
  <body>
    <img style="display: block; margin-left: auto; margin-right: auto; width: 50%;" src="https://paketo.io/images/paketo-logo-full-color.png"></img>
  </body>
</html>`);
});


// setup the wavefront metric
let c = new metrics.Counter();
registry.addTaggedMetric("request.counter", c, {"key1":"val1"});

app.listen(port);
