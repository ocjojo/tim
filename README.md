This is just a reference/archive.

This is a project that I initially developed within AIESECGermany to augment the experience on the AIESEC web portals.

It heavily extends the angular web app with functions needed within the german entity of AIESEC.
Using reverse engineering and different public angular functions I created a base system that allowed very easy extension of the original webapp.

A lot of the modules were developed by others as well.

At first it used a chrome extension to load the necessary files. Later on the script was loaded by the portals themselves.

For security reasons I removed the original git history.

Below is the original README.
----

# TIM
## Install
1. Clone this repo: `git clone git@github.com:AIESECGermany/tim.git [optional name]`
2. install dependencies `npm install`. If you are on windows you might need to use `npm install --no-bin-links` as it does not support symlinks.
3. `gulp` to build (see below for details).

If you are using our [dev-setup](https://github.com/AIESECGermany/dev-setup) vagrant box, see there for how to run the commands in the vagrant box.

## Extension
This repo contains an unpacked Chrome extension. It allows you to load the most recent tim from tim.aiesec.dev instead of the live version. This way you can test the newest code with EXPA.

To load it visit `chrome://extensions` --> *load unpacked extension* --> `expa_plus/src`.

### Gulp
The gulpfile is pretty much self-explanatory. To add a file to the build process, add it in the `config` section.
`src/**/*.(js|html)` files are added automatically.

If you want to use `gulp deploy`, you need to provide an the server section in the `config.json`.

#### Running tasks

With node and gulp installed locally, you can just use `gulp [taskname]` to run tasks. Otherwise you need to run the commands within vagrant.

Use `gulp --tasks` to see the available tasks and their dependencies.
