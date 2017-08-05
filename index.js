const util = require('util');
const AWS = require('aws-sdk');

const sns = new AWS.SNS();

// use separate region for rekognition due to limited region availability
AWS.config.rekognition = { endpoint: 'rekognition.us-west-2.amazonaws.com' };
const rekognition = new AWS.Rekognition();

exports.handler = (event, context, callback) => {
    console.log("Reading input from event:\n", util.inspect(event, {depth: 5}));

    let s3Record = event.Records[0].s3;
    let srcBucket = s3Record.bucket.name;
    let srcKey = decodeURIComponent(s3Record.object.key.replace(/\+/g, " "));

    var params = {
        Image: {
            S3Object: {
                Bucket: srcBucket,
                Name: srcKey
            }
        },
        MaxLabels: 10,
        MinConfidence: 60
    };

    rekognition.detectLabels(params).promise().then(function(data) {
        var message = process.env.BASE_URL +srcKey.replace("originals/","")+" , ";
        for (var i = 0; i < data.Labels.length; i++) {
          message += "Found " + data.Labels[i].Name + " with confidence: " + String(data.Labels[i].Confidence);
          if (i < data.Labels.length-1) {
            message += ", ";
          }
        }
        sns.publish({
                Message: message,
                TopicArn: process.env.TOPIC_ARN
            },
            function(err, data) {
              if (err) {
                console.log(err.stack);
              }
              console.log('sns sent');
              console.log(data);
            });
      }
    ).then(function (data) {
        callback(null, data);
    }).catch(function (err) {
      callback(err);
    });

};
