'use strict'
require('shelljs/global')
var isArray = require('util').isArray

var args
try {
    args = JSON.parse(process.env.npm_config_argv).original
} finally {
    if (!isArray(args)) {
        args = []
    }
}
var targetArgs = args.filter(function (arg) {
    return /^--(runtime|target)/.test(arg)
})
var targetStr = targetArgs.reduce(function (m, arg) {
    return m + ' ' + arg
}, '')

if(process.platform === 'win32'){
    // windows
    // todo: pass build args
    // exec('npm install sqlite3 --build-from-source' + targetStr)
    cd('node_modules/sqlite3')
    exec('npm i --build-from-source' + targetStr)
}else{
    // not windows
    if (process.platform === 'darwin') {
          // macos
          if (exec('which brew').stdout.trim() === '') {
            console.error('`brew` is required to be installed.')
            exit(1)
          }
          if (exec('brew list sqlcipher').code !== 0) {
            // exec('brew install sqlcipher')
            exec('brew install sqlcipher --with-fts')
          }

          // build for electron
          exec('export npm_config_target=`$(npm bin)/electron -v | cut -d v -f 2`')
          exec('export npm_config_disturl=https://atom.io/download/electron')
          exec('export npm_config_runtime=electron')
          exec('export npm_config_build_from_source=true')
          exec('export HOME=/tmp')

          // compile with sqlcipher, link staticly
          exec('export CPPFLAGS="-DSQLITE_HAS_CODEC -I`brew --prefix`/opt/sqlcipher/include -Wsign-compare -Wunused-function"')
          exec('export LDFLAGS="-static `brew --prefix`/opt/sqlcipher/lib/libsqlcipher.a `brew --prefix openssl`/lib/libcrypto.a"')

          cd('node_modules/sqlite3')
          exec('npm i --build-from-source --sqlite_libname=sqlcipher --prefix`' + targetStr)
    } else {
          // linux
          exec('export LDFLAGS="-L/usr/local/lib"')
          exec('export CPPFLAGS="-I/usr/local/include -I/usr/local/include/sqlcipher"')
          exec('export CXXFLAGS="$CPPFLAGS"')
          cd('node_modules/sqlite3')
          exec('npm i --build-from-source --sqlite_libname=sqlcipher --sqlite=/usr/local --verbose' + targetStr)
    }
}

