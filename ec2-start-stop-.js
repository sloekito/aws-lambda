/* A Lambda function that takes a tag key and can start or stop the instances associated with the tag
 */
 
exports.handler = function(event, context) {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    if (event.RequestType === 'Delete') {
        sendResponse(event, context, 'SUCCESS');
        return;
    }

    var tagKey = event.ResourceProperties.TagKey;
    var tagValue = event.ResourceProperties.TagValue;
    
    var responseStatus = 'FAILED';
    var responseData = {};

    // Verifies that a stack name was passed
    if (tagKey && tagValue) {
        var aws = require('aws-sdk');
		
		var ec2 = new aws.EC2();
	
		var params = {
			//InstanceIds: [ "i-94fd450f" ]
			Filters: [
				{
					Name: 'tag:' + tagKey,
					Values: [
					    tagValue
					]
				}
			]
		};
		
		ec2.describeInstances(params, function(err, data) {
			if (err) {
				responseData = { Error: 'DescribeInstances call failed' };
				console.log(err, err.stack); // an error occurred
				context.fail(responseData); 
			} else {
				var startParams = {
					InstanceIds: []
				};
				
				var instanceToStart = "";
				data.Reservations.forEach(function (reservation) {
					reservation.Instances.forEach(function (instance) {
						if (instance.State.Code === 80) {
							// 0: pending, 16: running, 32: shutting-down, 48: terminated, 64: stopping, 80: stopped
							startParams.InstanceIds.push(instance.InstanceId);
							instanceToStart += "instance.InstanceId ";
						}
					});
				});
				
				if (startParams.InstanceIds.length > 0) {
					ec2.startInstances(startParams, function(err, data) {
					  if (err) {
						responseData = { Error: 'StartInstances call failed' };
						console.log("error");   
						console.log(err, err.stack); // an error occurred
						context.fail(responseData); 
					  } else {
						responseStatus = 'SUCCESS';
						responseData = { Success: 'StartInstances call success' };
						console.log(data);           // successful response
						context.succeed(responseData + instanceToStart); 
					  }
					});
				} else {
					responseStatus = 'SUCCESS';
					responseData = { Success: 'Nothing to start' };
					context.succeed(responseData); 
				}
				
			}
		});
				
    } else {
        responseData = { Error: 'Stack name not specified' };
        console.log(responseData.Error);
    }
};



