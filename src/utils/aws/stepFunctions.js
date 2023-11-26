import AWS from 'aws-sdk';
import 'dotenv/config';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const STEP_FUNCTIONS_API = new AWS.StepFunctions();

/**
 * Tells a step function associated with the task token, that this step completed successfully
 * @param {any} taskToken A task token associated with a step function
 */
function sendTaskSuccess(taskToken) {
  const stepParams = {
    output: JSON.stringify({}),
    taskToken,
  };
  STEP_FUNCTIONS_API.sendTaskSuccess(stepParams, (stepErr, stepData) => {
    if (stepErr) {
      console.error('SendTaskSuccess Error:', stepErr);
    } else {
      console.log('Sent SendTaskSuccess successfully:', stepData);
    }
  });
}

/**
 * Tells a step function associated with the task token, that this step completed unsuccessfully
 * @param {any} taskToken A task token associated with a step function
 */
function sendTaskFailure(taskToken) {
  const stepParams = { taskToken };
  STEP_FUNCTIONS_API.sendTaskFailure(stepParams, (stepErr, stepData) => {
    if (stepErr) {
      console.error('SendTaskFailure Error:', stepErr);
    } else {
      console.log('Sent SendTaskFailure successfully:', stepData);
    }
  });
}

export { sendTaskSuccess, sendTaskFailure };
