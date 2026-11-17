import React from 'react';
import EditEmployee from './EditEmployee';

/**
 * EmployeeDetails View
 * Now renders the full comprehensive multi-step EditEmployee view with quick navigation.
 */
function EmployeeDetails(props) {
  return <EditEmployee {...props} />;
}

export default EmployeeDetails;
