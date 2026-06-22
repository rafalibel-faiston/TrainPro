-- AlterTable
ALTER TABLE "TrainerProfile" ADD COLUMN "inviteCode" TEXT;

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workoutId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutLogEntry" (
    "id" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "setsDone" INTEGER,
    "repsDone" TEXT,
    "weightKg" DOUBLE PRECISION,
    "done" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "logId" TEXT NOT NULL,

    CONSTRAINT "WorkoutLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "trainerId" TEXT,

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "time" TEXT,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dietPlanId" TEXT NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_inviteCode_key" ON "TrainerProfile"("inviteCode");

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLogEntry" ADD CONSTRAINT "WorkoutLogEntry_logId_fkey" FOREIGN KEY ("logId") REFERENCES "WorkoutLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlan" ADD CONSTRAINT "DietPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlan" ADD CONSTRAINT "DietPlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "DietPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
