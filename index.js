const util = require('util');
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition();
const sns = new AWS.SNS();
const dynamodb = new AWS.DynamoDB();

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
        var labels = [" ", " ", " ", " ", " ", " ", " ", " ", " ", " "];
        for (var i = 0; i < data.Labels.length; i++) {
          labels[i] = data.Labels[i].Name;
        }
        dynamodb.putItem({
            "TableName": "image-analysis",
            "Item": {
                "image": {
                    "S": srcKey.replace('.jpg','')
                },
                "label1": {
                    "S": labels[0]
                },
                "label2": {
                    "S": labels[1]
                },
                "label3": {
                    "S": labels[2]
                },
                "label4": {
                    "S": labels[3]
                },
                "label5": {
                    "S": labels[4]
                },
                "label6": {
                    "S": labels[5]
                },
                "label7": {
                    "S": labels[6]
                },
                "label8": {
                    "S": labels[7]
                },
                "label9": {
                    "S": labels[8]
                },
                "label10": {
                    "S": labels[9]
                }
            }
        }, function(err, data) {
            if (err) {
                console.log('ERROR: Dynamo failed: ' + err);
            } else {
                console.log('Dynamo Success: ' + JSON.stringify(data, null, '  '));
            }
        });
      }
    ).then(function (data) {
        callback(null, data);
    }).catch(function (err) {
      callback(err);
    });

};
