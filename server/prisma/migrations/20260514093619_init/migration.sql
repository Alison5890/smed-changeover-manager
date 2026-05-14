-- CreateTable
CREATE TABLE "operational_breakdowns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "styleName" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "styleNumber" TEXT NOT NULL,
    "totalOperations" INTEGER NOT NULL DEFAULT 0,
    "totalSAM" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "operations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "machineType" TEXT NOT NULL,
    "baseSAM" REAL NOT NULL,
    "allowancePercent" REAL NOT NULL DEFAULT 15,
    "totalSAM" REAL NOT NULL,
    "threadConsumption" REAL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "requiredGrade" TEXT,
    CONSTRAINT "operations_obId_fkey" FOREIGN KEY ("obId") REFERENCES "operational_breakdowns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfJoin" DATETIME NOT NULL,
    "grade" TEXT NOT NULL,
    "currentLine" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "worker_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "operationName" TEXT NOT NULL,
    "efficiency" REAL NOT NULL,
    "lastAssessed" DATETIME,
    CONSTRAINT "worker_skills_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "allocation_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lineId" TEXT NOT NULL,
    "obId" TEXT NOT NULL,
    "changeoverDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "allocation_plans_obId_fkey" FOREIGN KEY ("obId") REFERENCES "operational_breakdowns" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "allocation_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "workerId" TEXT,
    "matchScore" REAL,
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    CONSTRAINT "allocation_entries_planId_fkey" FOREIGN KEY ("planId") REFERENCES "allocation_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "allocation_entries_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "operations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "allocation_entries_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "machineCode" TEXT NOT NULL,
    "machineType" TEXT NOT NULL,
    "brand" TEXT,
    "currentLine" TEXT NOT NULL,
    "workstationNo" INTEGER,
    "condition" TEXT NOT NULL DEFAULT 'RUNNING',
    "lastMaintenanceDate" DATETIME,
    "nextMaintenanceDue" DATETIME,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "machine_transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "machineId" TEXT NOT NULL,
    "fromLine" TEXT NOT NULL,
    "toLine" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "reason" TEXT,
    "movedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "machine_transfers_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lineId" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "styleNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "factoryLine" TEXT NOT NULL,
    "fileHandoverDate" DATETIME NOT NULL,
    "changeoverDate" DATETIME NOT NULL,
    "obId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "checklists_obId_fkey" FOREIGN KEY ("obId") REFERENCES "operational_breakdowns" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checklistId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "daysBefore" INTEGER,
    "dueDate" DATETIME,
    "actualDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    CONSTRAINT "checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wip_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checklistId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "prevStyleLast" INTEGER,
    "newStyleFirst" INTEGER,
    "cotTarget" INTEGER,
    "peakTargetHrs" REAL,
    "remarks" TEXT,
    CONSTRAINT "wip_entries_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "workers_empNo_key" ON "workers"("empNo");

-- CreateIndex
CREATE UNIQUE INDEX "worker_skills_workerId_operationName_key" ON "worker_skills"("workerId", "operationName");

-- CreateIndex
CREATE UNIQUE INDEX "machines_machineCode_key" ON "machines"("machineCode");
