import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, FormControlLabel, Checkbox, Grid, Box
} from '@mui/material';
import { createTableGroup } from '../api/dbapi';



const AddTableGroupModal = ({ open, onClose, connectionId }) => {
    const [formValues, setFormValues] = useState({
        name: '',
        schema: '',
        includeMask: '%',
        excludeMask: 'tmp%',
        idMask: '%_id',
        skMask: '%_sk',
        minAge: 0,
        detectCDE: true,
        profileSample: false,
        scorecard: true,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormValues((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleAdd = async () => {
        try {
            console.log("Trying to create table group with connectionId:", connectionId);

            await createTableGroup(connectionId, {

                name: formValues.name,
                schema: formValues.schema,
                tables_to_include_mask: formValues.includeMask,
                tables_to_exclude_mask: formValues.excludeMask,
                profiling_id_column_mask: formValues.idMask,
                profiling_surrogate_key_column_mask: formValues.skMask,
                min_profiling_age_days: parseInt(formValues.minAge, 10),
                explicit_table_list: [],
            });
            onClose();
        } catch (error) {
            console.error('Error creating table group:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                Add Table Group
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField label="Name" name="name" value={formValues.name} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField label="Schema" name="schema" value={formValues.schema} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField label="Tables to Include Mask" name="includeMask" value={formValues.includeMask} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField label="Tables to Exclude Mask" name="excludeMask" value={formValues.excludeMask} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField label="Profiling ID Column Mask" name="idMask" value={formValues.idMask} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField label="Surrogate Key Column Mask" name="skMask" value={formValues.skMask} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField label="Min Profiling Age (Days)" type="number" name="minAge" value={formValues.minAge} onChange={handleChange} fullWidth size="small" inputProps={{ min: 0 }} />
                    </Grid>
                    <Grid item xs={12}>
                        <Box display="flex" flexDirection="row" flexWrap="wrap" gap={2}>
                            <FormControlLabel control={<Checkbox checked={formValues.detectCDE} onChange={handleChange} name="detectCDE" />} label="Detect CDEs" />
                            <FormControlLabel control={<Checkbox checked={formValues.profileSample} onChange={handleChange} name="profileSample" />} label="Use Profile Sampling" />
                            <FormControlLabel control={<Checkbox checked={formValues.scorecard} onChange={handleChange} name="scorecard" />} label="Add Scorecard for Table Group" />
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="secondary" variant="outlined">Cancel</Button>
                <Button onClick={handleAdd} variant="contained" color="primary">Add Table Group</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddTableGroupModal;