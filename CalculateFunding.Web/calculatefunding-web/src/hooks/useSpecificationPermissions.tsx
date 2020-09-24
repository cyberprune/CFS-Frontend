﻿import {useEffect, useMemo, useState} from "react";
import {getUserPermissionsService} from "../services/userService";
import {EffectiveSpecificationPermission} from "../types/EffectiveSpecificationPermission";

export enum SpecificationPermissions {
    Create = "Create",
    Edit = "Edit",
    Release = "Release",
    Refresh = "Refresh",
    Approve = "Approve"
}

export const useSpecificationPermissions = (specificationId: string, requiredPermissions: SpecificationPermissions[]) => {
    const [permissions, setPermissions] = useState<EffectiveSpecificationPermission>();

    useEffect(() => {
        getUserPermissionsService(specificationId)
            .then(result => {
                setPermissions(result.data);
            });
    }, [specificationId]);

    const canCreateSpecification = useMemo(() => {
        return permissions && permissions.canCreateSpecification;
    }, [permissions]);

    const canEditSpecification = useMemo(() => {
        return permissions && permissions.canEditSpecification;
    }, [permissions]);

    const canRefreshFunding = useMemo(() => {
        return permissions && permissions.canRefreshFunding;
    }, [permissions]);

    const canApproveFunding = useMemo(() => {
        return permissions && permissions.canApproveFunding;
    }, [permissions]);

    const canReleaseFunding = useMemo(() => {
        return permissions && permissions.canReleaseFunding;
    }, [permissions]);


    const missingPermissions = useMemo(() => {
        let missing: string[] = [];
        if (!canEditSpecification && requiredPermissions.includes(SpecificationPermissions.Edit)) {
            missing.push(SpecificationPermissions.Edit);
        }
        if (!canCreateSpecification && requiredPermissions.includes(SpecificationPermissions.Create)) {
            missing.push(SpecificationPermissions.Create);
        }
        if (!canRefreshFunding && requiredPermissions.includes(SpecificationPermissions.Refresh)) {
            missing.push(SpecificationPermissions.Refresh);
        }
        if (!canReleaseFunding && requiredPermissions.includes(SpecificationPermissions.Release)) {
            missing.push(SpecificationPermissions.Release);
        }
        if (!canApproveFunding && requiredPermissions.includes(SpecificationPermissions.Approve)) {
            missing.push(SpecificationPermissions.Approve);
        }
        return missing;
    }, [canCreateSpecification, canEditSpecification, canRefreshFunding, canApproveFunding, canReleaseFunding, requiredPermissions]);


    return {
        canCreateSpecification,
        canEditSpecification,
        canApproveFunding,
        canRefreshFunding,
        canReleaseFunding,
        missingPermissions
    }
};