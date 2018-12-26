async function test(url) {
    return await new Promise((resolve, reject) => {
        require((url.protocol === "https:") ? "https" : "http").get(url, res => {
            if (res.statusCode === 301 && res.headers["location"]) {
                test(new URL(res.headers["location"], url)).then(bool => {
                    resolve(bool);
                }).catch(e => {
                    reject(e);
                });
            } else {
                resolve( (res.statusCode === 200) ? true : false );
            }
        }).on("error", e => { reject(e); });
    });
}

process.on("message", e => {
    test(new URL(e)).then(bool => {
        process.send(bool);
    }).catch(e => {
        process.send(e.message);
    }).finally(() => {
        process.exit(0);
    });
});
