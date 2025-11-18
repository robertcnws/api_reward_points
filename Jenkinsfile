pipeline {

  triggers {
    githubPush()
  }

  agent none

  tools {
    nodejs 'node20'
  }

  environment {
    BACKEND_IMAGE            = "${AWS_ECR_REGISTRY}/reward-points-backend"
    FRONTEND_IMAGE           = "${AWS_ECR_REGISTRY}/reward-points-frontend"
    AWS_FRONTEND_ENV_CRED_ID = "AWS_FRONTEND_REWARD_POINTS_ENV_CRED_ID"
    // AWS_ECR_REGISTRY         = "324037323031.dkr.ecr.us-east-2.amazonaws.com/nws"
    // AWS_DEFAULT_REGION       = "us-east-2"
    // AWS_CLUSTER              = "api-dealerportal-cluster"
    // AWS_FRONTEND_SERVICE     = "reward-points-frontend-service"
    // AWS_BACKEND_SERVICE      = "reward-points-backend-service"
    JENKINS_HOOK             = "reward-points-repository-hook"
    SONARCLOUD_TOKEN         = "SONARCLOUD_TOKEN"
    SONARCLOUD_HOST          = "https://sonarcloud.io"
  }

  stages {

    stage('0. Load Infra Vars (SSM)') {
      agent { label 'docker' }
      steps {
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-creds'
        ]]) {
          script {
            
            def ssmGet = { String paramName ->
              return withEnv(["PARAM_NAME=${paramName}"]) {
                sh(
                  script: '''
                    docker run --rm \
                      -e AWS_ACCESS_KEY_ID \
                      -e AWS_SECRET_ACCESS_KEY \
                      -e AWS_SESSION_TOKEN \
                      -e AWS_DEFAULT_REGION \
                      -e PARAM_NAME \
                      amazon/aws-cli ssm get-parameter \
                        --name "$PARAM_NAME" \
                        --query "Parameter.Value" \
                        --output text
                  ''',
                  returnStdout: true
                ).trim()
              }
            }

            env.AWS_ECR_REGISTRY      = ssmGet('/reward-points/ecr/registry')
            env.AWS_CLUSTER           = ssmGet('/reward-points/ecs/cluster_name')
            env.AWS_BACKEND_SERVICE   = ssmGet('/reward-points/ecs/backend_service')
            env.AWS_FRONTEND_SERVICE  = ssmGet('/reward-points/ecs/frontend_service')

            echo "AWS_ECR_REGISTRY     = ${env.AWS_ECR_REGISTRY}"
            echo "AWS_CLUSTER          = ${env.AWS_CLUSTER}"
            echo "AWS_BACKEND_SERVICE  = ${env.AWS_BACKEND_SERVICE}"
            echo "AWS_FRONTEND_SERVICE = ${env.AWS_FRONTEND_SERVICE}"
          }
        }
      }
    }

    stage('1. Checkout & Stash') {
      agent any
      steps {
        checkout scm
        stash name: 'source', includes: '**'
      }
    }

    // stage('2. SonarCloud Analysis') {
    //   agent { label 'docker' }
    //   steps {
    //     deleteDir()
    //     unstash 'source'
    //     withCredentials([string(credentialsId: env.SONARCLOUD_TOKEN, variable: 'SONAR_TOKEN')]) {
    //       script {
    //         sh '''
    //           docker run --rm \
    //               -e SONAR_TOKEN=$SONAR_TOKEN \
    //               -v $PWD:/usr/src \
    //               -w /usr/src \
    //               sonarsource/sonar-scanner-cli \
    //               -Dsonar.login=$SONAR_TOKEN \
    //         '''
    //         sh '''
    //           # get the project key from sonar.properties
    //           PROJECT_KEY=$(grep '^sonar.projectKey=' sonar-project.properties | cut -d'=' -f2)
    //           if [ -z "$PROJECT_KEY" ]; then
    //             echo "Not able to find sonar.projectKey in sonar-project.properties"
    //             exit 1
    //           fi

    //           STATUS=$(curl -s -u $SONAR_TOKEN: "https://sonarcloud.io/api/qualitygates/project_status?projectKey=${PROJECT_KEY}" \
    //             | jq -r '.projectStatus.status')

    //           echo "SonarCloud Quality Gate status: $STATUS"
    //           if [ "$STATUS" != "OK" ]; then
    //             echo "❌ Quality Gate failed"
    //             exit 1
    //           fi
    //         '''
    //       }
    //     }
    //   }
    // }

    stage('2. Verify Docker') {
      agent { label 'docker' }
      steps {
        sh 'echo "Docker version: $(docker --version)"'
        sh 'echo "Docker Compose version: $(docker-compose --version)"'
        sh 'echo "Docker info: $(docker info)"'
      }
    }


    stage('3. Verify agent groups') {
      agent { label 'docker' }
      steps {
        sh 'echo "Users: $(id -un)"'
        sh 'echo "Groups: $(id -Gn)"'
      }
    }

    stage('4. Smoke Test Docker') {
      agent { label 'docker' }
      steps {
        echo "🔍 Testing Docker from this agent in EC2..."
        sh 'docker version'
        sh 'docker info'
        sh 'docker-compose version'
      }
    }

    stage('5. Login to ECR') {
      agent { label 'docker' }
      steps {
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-creds'
        ]]) {
          sh '''
            docker run --rm \
              -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
              -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
              amazon/aws-cli ecr get-login-password --region $AWS_DEFAULT_REGION \
            | docker login --username AWS --password-stdin $AWS_ECR_REGISTRY
          '''
        }
      }
    }

    stage('6. Prune Docker') {
      agent { label 'docker' }
      steps {
        sh 'docker system prune -af || true'
      }
    }

    stage('7. Build & Push Backend') {
      when { changeset "**/backend_app/**" }
      agent { label 'docker' }
      steps {
        deleteDir()
        unstash 'source'
        dir('backend_app') {
          sh """
            docker-compose -f ../docker-compose.aws.backend.prod.yml build
            docker tag "ne_${JENKINS_HOOK}_aws_backend_app:latest" "${BACKEND_IMAGE}:latest"
            docker push "${BACKEND_IMAGE}:latest"
          """
        }
      }
    }

    stage('8. Build & Push Frontend') {
      when { changeset "**/frontend_app/**" }
      agent { label 'docker' }
      steps {
        deleteDir()
        unstash 'source'
        dir('frontend_app') {
          withCredentials([file(credentialsId: env.AWS_FRONTEND_ENV_CRED_ID, variable: 'ENV_FILE')]) {
            sh 'cp $ENV_FILE .env'
          }
          sh 'npm cache clean --force'
          sh 'npm install'
          // sh 'npm ci'
          sh 'npm run lint -- --fix'
          sh 'npm run build'
          sh """
            docker-compose -f ../docker-compose.aws.frontend.prod.yml build
            docker tag "ne_${JENKINS_HOOK}_aws_frontend_app:latest" "${FRONTEND_IMAGE}:latest"
            docker push "${FRONTEND_IMAGE}:latest"
          """
        }
      }
    }

    stage('9. Deploy Backend') {
      when { changeset "**/backend_app/**" }
      agent { label 'docker' }
      steps {
        echo "→ There are changes in backend_app, redeploy backend"
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-creds'
        ]]) {
          sh '''
            docker run --rm \
              -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
              -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
              -e AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION \
              amazon/aws-cli ecs update-service \
                --cluster $AWS_CLUSTER \
                --service $AWS_BACKEND_SERVICE \
                --force-new-deployment
          '''
        }
      }
    }

    stage('10. Deploy Frontend') {
      when { changeset "**/frontend_app/**" }
      agent { label 'docker' }
      steps {
        echo "→ There are changes in frontend_app, redeploy frontend"
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-creds'
        ]]) {
          sh '''
            docker run --rm \
              -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
              -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
              -e AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION \
              amazon/aws-cli ecs update-service \
                --cluster $AWS_CLUSTER \
                --service $AWS_FRONTEND_SERVICE \
                --force-new-deployment
          '''
        }
      }
    }

    stage('11. Verify Deployments') {
      agent { label 'docker' }
      steps {
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-creds'
        ]]) {
          script {
            def services = [env.AWS_BACKEND_SERVICE, env.AWS_FRONTEND_SERVICE]
            services.each { svc ->
              echo "⏳ Waiting for ${svc} to complete deployment…"
              timeout(time: 10, unit: 'MINUTES') {
                waitUntil {
                  def state = sh(
                    script: """
                      docker run --rm \\
                        -e AWS_ACCESS_KEY_ID=${env.AWS_ACCESS_KEY_ID} \\
                        -e AWS_SECRET_ACCESS_KEY=${env.AWS_SECRET_ACCESS_KEY} \\
                        -e AWS_DEFAULT_REGION=${env.AWS_DEFAULT_REGION} \\
                        amazon/aws-cli ecs describe-services \\
                          --cluster ${env.AWS_CLUSTER} \\
                          --services ${svc} \\
                          --query "services[0].deployments[?status=='PRIMARY'].rolloutState" \\
                          --output text
                    """,
                    returnStdout: true
                  ).trim()
                  
                  echo "→ ${svc} rolloutState = ${state}"
                    return (state == 'COMPLETED')
                  }
              }
              echo "✅ ${svc} deployment COMPLETED"
            }
            echo "✅ Both deployments are COMPLETED"
          }
        }
      }
    }

    stage('12. Notify') {
      when { expression { currentBuild.currentResult == 'SUCCESS' } }
      steps {
        emailext(
          mimeType: 'text/html',
          subject: "✅ Build #${env.BUILD_NUMBER} Success – ${env.JOB_NAME}",
          to: '$DEFAULT_RECIPIENTS',
          from: 'Jenkins NWS CI/CD (CUSTOMER PORTAL) <nnws15815@gmail.com>',
          body: '''<!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .header { background: #004579; padding: 10px; color: white; }
                    .content { padding: 20px; }
                    .changelog { background: #f9f9f9; border: 1px solid #ddd; padding: 10px; }
                    .commit { margin-bottom: 8px; }
                    .commit-author { font-weight: bold; }
                    .footer { font-size: 0.8em; color: #777; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    Jenkins CI/CD Notification (CUSTOMER PORTAL)
                  </div>
                  <div class="content">
                    <h1>Build #${BUILD_NUMBER} – Success 🎉</h1>
                    <p><strong>Project:</strong> ${JOB_NAME}</p>
                    <p><strong>URL:</strong> <a href="${BUILD_URL}">${BUILD_URL}</a></p>
                    
                    <h2>Commits included:</h2>
                    <div class="changelog">
                      <ul>
                        ${CHANGES, showPaths="true", format="<li class='commit'><span class='commit-author'>%a</span> – (<code>%r</code>)<br/><pre style='background:#eee;padding:8px;'>%m</pre><br/><small>Files:<br/>%p</small><br/></li>"}
                      </ul>
                    </div>
                  </div>
                  <div class="footer">
                    This is an automated message generated by Jenkins. Please contact DevOps Team for more questions.
                  </div>
                </body>
              </html>''',
        )
      }
    }
  } 

  post {
    failure {
      emailext(
        mimeType: 'text/html',
        subject: "❌ Build #${env.BUILD_NUMBER} Failed – ${env.JOB_NAME}",
        to: '$DEFAULT_RECIPIENTS',
        from: 'Jenkins NWS CI/CD (CUSTOMER PORTAL) <nnws15815@gmail.com>',
        body: '${FILE,path="failure_template.html"}'
      )
    }
  }
}    
