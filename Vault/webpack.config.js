const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
    output: {
        filename: '[name].js',
        path: __dirname + '/wwwroot/js/dist',
        library: 'Vault'
    },
    entry: {
        'index': './wwwroot/js/src/index.ts',
        'setdevcookie': './wwwroot/js/src/setdevcookie.ts',
        'generatevaultcredential': './wwwroot/js/src/generatevaultcredential.ts',
    },
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin()
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        alias: {
            'handlebars': 'handlebars/dist/handlebars.js'
        }
    },
    module: {
        rules: [
            {
                test: /\.ts(x)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    }
};
