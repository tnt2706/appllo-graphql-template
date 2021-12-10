function resultException(message) {
  return { isSuccess: false, message };
}

function resultPermissionDenied() {
  return {
    isSuccess: false,
    message: 'Permission denied.',
  };
}

function resultNotFoundData(message) {
  return {
    isSuccess: false,
    message: `${message} not found.`,
  };
}

function resultInvalidData(message) {
  return {
    isSuccess: false,
    message: `${message}  invalid.`,
  };
}

function resultErrorMessageOther(message) {
  return { isSuccess: false, message };
}

module.exports = {
  resultException,
  resultPermissionDenied,
  resultNotFoundData,
  resultErrorMessageOther,
  resultInvalidData,
};
