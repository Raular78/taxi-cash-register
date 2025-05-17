module.exports = {
  apps: [
    {
      name: "taxi-cash-register",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
