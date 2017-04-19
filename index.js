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
        var labels = [" ", " ", " ", " ", " ", " ", " ", " ", " ", " "];
        for (var i = 0; i < data.Labels.length; i++) {
          labels[i] = {"label": { "S": data.Labels[i].Name }, "confidence": { "N": data.Labels.Confidence }};
        }

        dynamodb.putItem({
            "TableName": "image-analysis",
            "Item": {
                "image": {
                    "S": srcKey.replace('.jpg','')
                },
                "label1"
                  "M": labels[0]
                },
                "label2": {
                    "M": labels[1]
                },
                "label3": {
                    "M": labels[2]
                },
                "label4": {
                    "M": labels[3]
                },
                "label5": {
                    "M": labels[4]
                },
                "label6": {
                    "M": labels[5]
                },
                "label7": {
                    "M": labels[6]
                },
                "label8": {
                    "M": labels[7]
                },
                "label9": {
                    "M": labels[8]
                },
                "label10": {
                    "M": labels[9]
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
