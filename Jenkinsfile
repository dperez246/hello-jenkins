
def userHost="ubuntu"

pipeline {
    agent any
    stages {
        stage('Notify') {
            when { anyOf { branch 'develop'; branch 'demo' } }
            steps {
                slackSend( channel: "#tramiteya", color: '#FFFF00', message: ":crossed_fingers::skin-tone-5: STARTED: Build ${env.JOB_NAME} [${env.BUILD_NUMBER}] (<${env.RUN_DISPLAY_URL}|Open>)")
            }
        }
        stage('Prepare Build') {
            agent {
                docker {
                    image 'darkj24/node-gyp-compatible:1.0'
                    args '-v $HOME/docker-images-cached:/root/docker-images-cached'
                }
            }
            stages {
                stage('Build') {
                    steps {
                        sh 'yarn install'
                    }
                }
                stage('Lint') {
                    steps {
                        sh 'yarn lint'
                    }
                }
            }
        }
    }
    post {
        success {
            script {
                if (env.BRANCH_NAME == 'develop') {
                    slackSend( channel: "#tramiteya", color: '#00FF00', message: "<!here> :smiley: SUCCESSFUL: Build ${env.JOB_NAME} [${env.BUILD_NUMBER}] (<${env.RUN_DISPLAY_URL}|Open>)")
                }
            }
        }
        failure {
            script {
                if (env.BRANCH_NAME == 'develop') {
                    slackSend( channel: "#tramiteya", color: '#FF0000', message: "<!here> :scream: FAILED: Build ${env} [${env.BUILD_NUMBER}] (<${env.RUN_DISPLAY_URL}|Open>)")
                }
            }
        }
        unstable {
            script {
                if (env.BRANCH_NAME == 'develop') {
                    slackSend( channel: "#tramiteya", color: '#FF0000', message: "<!here> :grimacing: UNSTABLE: Build ${env} [${env.BUILD_NUMBER}] (<${env.RUN_DISPLAY_URL}|Open>)")
                }
            }
        }
    }
}