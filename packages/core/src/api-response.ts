export const apiResponse = {
    notAuthenticated: {
        status: 403,
        data: {
            error: { message: "You don't have permission to perform this action!" },
        },
    },
    serverError: {
        status: 500,
        data: { error: { message: "Some error happened on the server!" } },
    },
    routeNotFound: {
        status: 404,
        data: { error: { message: "Route Not Found" } },
    },
    duplicatedId: {
        status: 409,
        data: {
            error: {
                message: "duplicated slug",
            },
        },
    },
    recordNotFound: {
        status: 200,
        data: {
            error: {
                message: "Record not found",
            },
        },
    },
    ownerLeaveError: {
        status: 400,
        data: {
            error: {
                message: "owner can't leave the organization",
            },
        },
    },
};
