module.exports = function (api) {
    api.cache(true);
    // En production (builds EAS/TestFlight), les console.log/info/debug sont
    // retirés du code : pas de jetons ni de données personnelles dans les
    // journaux de l'appareil. console.warn et console.error sont conservés.
    const isProduction = process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production';
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: isProduction ? [["transform-remove-console", { exclude: ["error", "warn"] }]] : [],
    };
};
