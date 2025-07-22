BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'USER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[RefreshToken] (
    [id] INT NOT NULL IDENTITY(1,1),
    [token] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RefreshToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [expiresAt] DATETIME2 NOT NULL,
    CONSTRAINT [RefreshToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefreshToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[Company] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAT] DATETIME2 NOT NULL CONSTRAINT [Company_createdAT_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Company_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Company_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Location] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAT] DATETIME2 NOT NULL CONSTRAINT [Location_createdAT_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Location_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Location_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Lecturer] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAT] DATETIME2 NOT NULL CONSTRAINT [Lecturer_createdAT_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Lecturer_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Lecturer_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Video] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [detail] NVARCHAR(1000),
    [filePath] NVARCHAR(1000) NOT NULL,
    [timeAdvert] INT NOT NULL CONSTRAINT [Video_timeAdvert_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Video_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Video_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Video_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Question] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [answer] NVARCHAR(1000) NOT NULL CONSTRAINT [Question_answer_df] DEFAULT 'YES',
    [createdAT] DATETIME2 NOT NULL CONSTRAINT [Question_createdAT_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Question_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Question_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[QuestionEnd] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAT] DATETIME2 NOT NULL CONSTRAINT [QuestionEnd_createdAT_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [QuestionEnd_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [QuestionEnd_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[QuestionEndList] (
    [id] INT NOT NULL IDENTITY(1,1),
    [question] NVARCHAR(1000) NOT NULL,
    [status] INT NOT NULL CONSTRAINT [QuestionEndList_status_df] DEFAULT 0,
    [questionEndId] INT NOT NULL,
    [createdAT] DATETIME2 NOT NULL CONSTRAINT [QuestionEndList_createdAT_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [QuestionEndList_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Member] (
    [id] INT NOT NULL IDENTITY(1,1),
    [titleName] NVARCHAR(1000) NOT NULL,
    [fname] NVARCHAR(1000) NOT NULL,
    [lname] NVARCHAR(1000) NOT NULL,
    [idCard] NVARCHAR(1000) NOT NULL,
    [idCardType] INT NOT NULL CONSTRAINT [Member_idCardType_df] DEFAULT 1,
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000) NOT NULL,
    [companyId] INT NOT NULL,
    [verify] INT NOT NULL CONSTRAINT [Member_verify_df] DEFAULT 0,
    [locationId] INT NOT NULL,
    [lecturerId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Member_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [statusVideoEnd] INT NOT NULL CONSTRAINT [Member_statusVideoEnd_df] DEFAULT 0,
    [statusQuestionEnd] INT NOT NULL CONSTRAINT [Member_statusQuestionEnd_df] DEFAULT 0,
    [dateOfTraining] DATETIME2,
    [dateEndCertificate] DATETIME2,
    CONSTRAINT [Member_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Member_idCard_key] UNIQUE NONCLUSTERED ([idCard])
);

-- CreateTable
CREATE TABLE [dbo].[VideoToken] (
    [id] INT NOT NULL IDENTITY(1,1),
    [token] NVARCHAR(1000) NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [idCard] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [used] BIT NOT NULL CONSTRAINT [VideoToken_used_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [VideoToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [VideoToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [VideoToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[MemberChangeCompany] (
    [id] INT NOT NULL IDENTITY(1,1),
    [oldCompanyId] INT NOT NULL,
    [newCompany] NVARCHAR(1000) NOT NULL,
    [memberId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MemberChangeCompany_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MemberChangeCompany_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoToken_expiresAt_idx] ON [dbo].[VideoToken]([expiresAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoToken_used_idx] ON [dbo].[VideoToken]([used]);

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuestionEndList] ADD CONSTRAINT [QuestionEndList_questionEndId_fkey] FOREIGN KEY ([questionEndId]) REFERENCES [dbo].[QuestionEnd]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Member] ADD CONSTRAINT [Member_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Member] ADD CONSTRAINT [Member_locationId_fkey] FOREIGN KEY ([locationId]) REFERENCES [dbo].[Location]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Member] ADD CONSTRAINT [Member_lecturerId_fkey] FOREIGN KEY ([lecturerId]) REFERENCES [dbo].[Lecturer]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MemberChangeCompany] ADD CONSTRAINT [MemberChangeCompany_oldCompanyId_fkey] FOREIGN KEY ([oldCompanyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MemberChangeCompany] ADD CONSTRAINT [MemberChangeCompany_memberId_fkey] FOREIGN KEY ([memberId]) REFERENCES [dbo].[Member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
