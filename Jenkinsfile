pipeline {
    agent any

    environment {
        // 定义镜像名称
        IMAGE_NAME = "todolist-server"
        QN_AK     = "${params.QN_AK}"
        QN_SK     = "${params.QN_SK}"
        QN_bucketName = "${params.QN_BUCKET_NAME}"
        MYSQL_URL = "${params.MYSQL_DATABASE_URL}"
        REDIS_URL = "${params.REDIS_DATABASE_URL}"
        EMAIL     = "${params.EMAIL}"
        PASS      = "${params.EMAIL_PASS}"
    }

    stages {
        stage('Checkout') {
            steps {
                // 拉取代码
                checkout scm
            }
        }

        stage('Create Env File') {
            steps {
                // 动态创建 .env 文件，把你的那些 Key 填在这里
                sh """
                echo "QN_AK=${env.QN_AK}" > .env
                echo "QN_SK=${env.QN_SK}" >> .env
                echo "QN_BUCKET_NAME=${env.QN_BUCKET_NAME}" >> .env
                echo "MYSQL_DATABASE_URL=${env.MYSQL_DATABASE_URL}" >> .env
                echo "REDIS_DATABASE_URL=${env.REDIS_DATABASE_URL}" >> .env
                echo "EMAIL=${env.EMAIL}" >> .env
                echo "EMAIL_PASS=${env.EMAIL_PASS}" >> .env
                """

                sh "ls -la .env"
            }
        }

        stage('Docker Build') {
            steps {
                // 使用我们之前写好的 Dockerfile 进行打包
                sh "docker-compose build"
            }
        }

        stage('Deploy') {
            steps {
                // 停止旧容器并启动新容器
                sh "docker-compose down || true"
                sh "docker-compose up -d"
            }
        }
    }

    post {
        success {
            echo '部署成功！'
        }
        failure {
            echo '部署失败，请检查日志。'
        }
    }
}