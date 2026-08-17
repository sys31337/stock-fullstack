// Side-effect import file: ensures every synced Mongoose model is registered
// in both host and client modes, even if its REST endpoint is not used.
import './role';
import './user';
import './customers';
import './categories';
import './warehouse';
import './products';
import './bills';
import './transactions';
import './payments';
import './stockMovement';
import './warehouseTransfer';
import './deliveryReturn';
import './settings';
import './charges';
import './posSession';
import './auditLog';
import './syncOperation';
import './syncConflict';
import './syncState';
import './syncChangeLog';
import './syncAppliedOperation';
