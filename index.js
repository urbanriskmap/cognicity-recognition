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
        var labels = [];
        for (var i = 0; i < 10; i++) {
          labels[i] = {"label": { "S": " " }, "confidence": { "N": "0" }};
        }

        var item = {};
        item["image"] = { "S": srcKey.replace('.tif','').replace('.TIF','').replace('.jpg','').replace('.JPG','').replace('.png','') };

        for (var i = 0; i < data.Labels.length; i++) {
          item["label"+String(i)] = { "S": data.Labels[i].Name };
          item["confidence"+String(i)] = { "N": String(data.Labels[i].Confidence) };
        }

        for (var i = data.Labels.length; i < 10; i++) {
          item["label"+String(i)] = { "S": " " };
          item["confidence"+String(i)] = { "N": "0" };
        }

        dynamodb.putItem({
            "TableName": "image-analysis",
            "Item": item
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
