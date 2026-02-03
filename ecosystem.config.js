{
    "apps": [{
        "name": "dashboard-whatsapp",
        "script": "server.js",
        "instances": 1,
        "exec_mode": "cluster",
        "env": {
            "NODE_ENV": "production",
            "PORT": 3000
        },
        "error_file": "logs/error.log",
        "out_file": "logs/output.log",
        "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
        "merge_logs": true,
        "autorestart": true,
        "watch": false,
        "max_memory_restart": "500M",
        "exp_backoff_restart_delay": 100
    }]
}
