from flask import Flask
from flask import render_template

app = Flask(__name__)


@app.route("/")
def slash():
    return """
    <!DOCTYPE html>
<html>
  <head>
    <title>Python powered By Paketo Buildpacks</title>
  </head>
  <body>
    <img style="display: block; margin-left: auto; margin-right: auto; width: 50%;" src="https://paketo.io/images/paketo-logo-full-color.png"></img>
  </body>
</html>
    """