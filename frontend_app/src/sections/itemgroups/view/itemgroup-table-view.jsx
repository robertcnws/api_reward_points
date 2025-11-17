import { useContext, useEffect, useMemo, useState } from "react";
import { Card, Table, TableBody, TableContainer } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useSetState } from "src/hooks/use-set-state";
import { LoadingContext } from "src/auth/context/loading-context";
import {
    useTable,
    rowInPage,
    TableNoData,
    getComparator,
    TableHeadCustom,
    TableSelectedAction,
} from "src/components/table";
import { TableCustomPaginationZohoStyleRow } from "src/components/table/table-pagination-custom-zoho-style-row";
import { ItemgroupTableFilters } from "../itemgroup-table-filters";
import { ItemgroupTableFiltersResult } from "../itemgroup-table-filters-result";
import { ItemgroupTableRow } from "../itemgroup-table-row";

export const itemOthers = {
    series: [
        { value: 'mg400', label: 'MG 400' },
        { value: 'mg450', label: 'MG 450' },
        { value: 'mg500', label: 'MG 500' },
        { value: 'mg1000', label: 'MG 1000' },
        { value: 'mg1100', label: 'MG 1100' },
        { value: 'mg5000', label: 'MG 5000' },
        { value: 'sgd', label: 'MG SGD' },
        { value: 'eco60', label: 'ECO 60' },
        { value: 'eco200', label: 'ECO 200' },
        { value: 'eco700', label: 'ECO 700' },
        { value: 'mx3000', label: 'MX 3000' },
        { value: 'mx4000', label: 'MX 4000' },
    ]
}


export const itemTypes = [
    { value: 'windows', label: 'Windows' },
    { value: 'doors', label: 'Doors' },
    { value: 'storeFronts', label: 'Store Fronts' },
    { value: 'accessories', label: 'Parts' },
]

export const itemColors = [
    { value: 'bronze', label: 'Bronze' },
    { value: 'gray', label: 'Gray' },
    { value: 'white', label: 'White' },
    { value: 'bronze_gray', label: 'Bronze / Gray' },
    { value: 'white_gray', label: 'White / Gray' },
]

export const itemSeries = [
    {
        value: 'mg200',
        label: 'MG 200',
        configurations: []
    },
    {
        value: 'mg300',
        label: 'MG 300',
        configurations: [
            { value: 'xx', label: 'XX' },
            { value: 'xo', label: 'XO' },
            { value: 'ox', label: 'OX' },
            { value: 'xox', label: 'XOX' },
            { value: 'oxo', label: 'OXO' },
        ]
    },
    {
        value: 'mg350',
        label: 'MG 350',
        configurations: [
            { value: 'xx', label: 'XX' },
            { value: 'xo', label: 'XO' },
            { value: 'ox', label: 'OX' },
            { value: 'xox', label: 'XOX' },
            { value: 'oxo', label: 'OXO' },
        ]
    },
    {
        value: 'mg350 sh',
        label: 'MG 350 SH',
        configurations: []
    },
    {
        value: 'mg350 pw',
        label: 'MG 350 PW',
        configurations: [
            { value: 'arc', label: 'ARC' },
            { value: 'sqr', label: 'SQUARE' },
        ]
    },
    {
        value: 'mg600',
        label: 'MG 600',
        configurations: []
    },
    {
        value: 'mg1500',
        label: 'MG 1500',
        configurations: [
            { value: 'xx', label: 'XX' },
            { value: 'xo', label: 'XO' },
            { value: 'ox', label: 'OX' },
            { value: 'xox', label: 'XOX' },
            { value: 'oxo', label: 'OXO' },
        ]
    },
    {
        value: 'mg3000',
        label: 'MG 3000',
        configurations: [
            { value: 'xr', label: 'XR' },
            { value: 'xl', label: 'XL' },
            { value: 'xxr', label: 'XXR' },
            { value: 'xxl', label: 'XXL' },
        ]
    },
    {
        value: 'others',
        label: 'Others',
        configurations: [],
        references: itemOthers.series
    },
]


export const itemClasses = [
    { value: 'hr', label: 'Horizontal Rolling' },
    { value: 'sh', label: 'Single Hung' },
    { value: 'pw', label: 'Picture Window' },
    { value: 'casement', label: 'Casement' },
    { value: 'fd', label: 'French Door' },
    { value: 'sgd', label: 'Sliding Glass Door' },
]

export const itemConfigurations = [
    { value: 'xx', label: 'XX' },
    { value: 'xo', label: 'XO' },
    { value: 'ox', label: 'OX' },
    { value: 'xox', label: 'XOX' },
    { value: 'oxo', label: 'OXO' },
    { value: 'xr', label: 'XR' },
    { value: 'xl', label: 'XL' },
    { value: 'xxr', label: 'XXR' },
    { value: 'xxl', label: 'XXL' },
]

export function ItemgroupTableView({
    loadedItemgroups,
    refetchItemgroups,
    loadingItemgroups,
}) {

    const { isMobile } = useContext(LoadingContext);

    const TABLE_HEAD = [
        { id: 'sku', label: 'SKU' },
        ...!isMobile ? [
            { id: 'name', label: 'Product' },
        ] : [],
        { id: 'actualAvailableStock', label: 'Actual Available Stock' },
        { id: '' },
    ];

    const filters = useSetState({
        name: '',
        type: [],
        color: [],
        series: [],
        class: [],
        configuration: [],

    });

    const options = useSetState({
        types: itemTypes,
        colors: itemColors,
        series: itemSeries,
        classes: itemClasses,
        configurations: [],
        // configurations: itemConfigurations,
    });

    const table = useTable({ defaultDense: true });

    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        const allItems = loadedItemgroups
            ?.flatMap((ig) => ig.listItems || [])
            .reduce((acc, item) => {
                if (!acc.some((x) => x.id === item.id)) {
                    acc.push(item);
                }
                return acc;
            }, [])
            .sort((a, b) => a.name.localeCompare(b.name));
        setTableData(allItems);
    }, [loadedItemgroups])

    const dataFiltered = useMemo(() => applyFilter({
        inputData: tableData,
        comparator: getComparator(table.order, table.orderBy),
        filters: filters.state,
    }), [tableData, table.order, table.orderBy, filters.state]);

    const dataInPage = useMemo(
        () => rowInPage(dataFiltered, table.page, table.rowsPerPage),
        [dataFiltered, table.page, table.rowsPerPage]
    );

    const canReset = useMemo(() => (
        !!filters.state.name ||
        filters.state.type.length > 0 ||
        filters.state.color.length > 0 ||
        filters.state.series.length > 0 ||
        filters.state.class.length > 0 ||
        filters.state.configuration.length > 0
    ), [filters.state]);

    const notFound = useMemo(() => (!dataFiltered.length && canReset) || !dataFiltered.length, [dataFiltered.length, canReset]);

    return (
        <Box sx={{ width: '100%' }}>
            <Stack
                spacing={2.5}
                sx={{ my: { xs: 3, md: 3 }, width: '100%' }}
                display='flex'
                flexDirection='row'
                alignItems='center'
                justifyContent='space-between'
            >
                <Card sx={{ width: '100%' }}>
                    <ItemgroupTableFilters
                        filters={filters}
                        options={options}
                        onResetPage={table.onResetPage}
                    />
                    {canReset && (
                        <ItemgroupTableFiltersResult
                            filters={filters}
                            options={options}
                            totalResults={dataFiltered.length}
                            onResetPage={table.onResetPage}
                            sx={{ p: 2.5, pt: 0 }}
                        />
                    )}
                    <TableContainer sx={{
                        px: { md: 1 },
                        minWidth: { xs: 380, md: '100%' },
                        maxHeight: !canReset ? 'calc(100vh - 330px)' : 'calc(100vh - 430px)',
                        overflowY: 'auto',
                    }} >
                        <Table size={table.dense ? 'small' : 'medium'} stickyHeader>
                            <TableHeadCustom
                                order={table.order}
                                orderBy={table.orderBy}
                                headLabel={TABLE_HEAD}
                                rowCount={dataFiltered.length}
                                onSort={table.onSort}
                            />

                            <TableBody>
                                {dataFiltered
                                    .slice(
                                        table.page * table.rowsPerPage,
                                        table.page * table.rowsPerPage + table.rowsPerPage
                                    )
                                    .map((row) => (
                                        <ItemgroupTableRow
                                            key={row.id}
                                            row={row}
                                        // selected={table.selected.includes(row.id)}
                                        // onSelectRow={() => table.onSelectRow(row.id)}
                                        // onDeleteRow={() => handleDeleteRow(row.id)}
                                        // onEditRow={() => handleEditRow(row.id)}
                                        // onChangeApprovalRow={() => handleChangeApprovalRow(row.id)}
                                        // onActiveRow={() => handleChangeActiveRow(row.id)}
                                        />
                                    ))}

                                {dataFiltered?.length > 0 && (
                                    <TableCustomPaginationZohoStyleRow
                                        columnsLength={TABLE_HEAD.length}
                                        data={dataFiltered}
                                        page={table.page}
                                        rowsPerPage={table.rowsPerPage}
                                        handleChangePage={(event, newPage) => {
                                            localStorage.setItem('itemPage', newPage);
                                            table.onChangePage(event, newPage);
                                        }}
                                        handleChangeRowsPerPage={(event) => {
                                            localStorage.setItem('itemRowsPerPage', event.target.value);
                                            table.onChangeRowsPerPage(event);
                                        }}
                                        dense={table.dense}
                                        onChangeDense={table.onChangeDense}
                                    />
                                )}

                                <TableNoData notFound={notFound} />
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            </Stack>
        </Box>
    )
}

function applyFilter({ inputData, comparator, filters }) {
    const {
        name,
        type,
        color,
        series,
        class: classes,
        configuration
    } = filters;

    const stabilizedThis = inputData.map((el, index) => [el, index]);

    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });

    inputData = stabilizedThis.map((el) => el[0]);

    if (name) {
        inputData = inputData.filter(
            (i) => i?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                i?.sku?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                i?.description?.toLowerCase().indexOf(name.toLowerCase()) !== -1
        );
    }

    if (type.length) {
        inputData = matchesType(inputData, type);
    }

    if (color.length) {
        inputData = inputData.filter((item) => matchesColor(item, color));
    }

    if (series.length) {
        inputData = inputData.filter((item) => matchesComun(item, series));
    }

    if (classes.length) {
        inputData = inputData.filter((item) => matchesClass(item, classes));
    }

    if (configuration.length) {
        inputData = inputData.filter((item) => matchesComun(item, configuration));
    }

    return inputData;
}

export function matchesType(inputData, typeSelections) {
    if (!typeSelections.length) return true;
    let accesoriesData = [];
    let windowsData = [];
    let doorsData = [];
    let storeFrontsData = [];
    if (typeSelections.includes('accessories')) {
        accesoriesData = inputData.filter((item) => item?.sku?.toLowerCase().indexOf('mull') !== -1);
    }
    if (typeSelections.includes('windows')) {
        windowsData = inputData.filter(
            (item) => item?.sku?.toLowerCase().indexOf('mg3000') === -1
        )
        windowsData = windowsData.filter(
            (item) => item?.sku?.toLowerCase().indexOf('mg200') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mg300') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mg350') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mg400') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mg450') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mg600') !== -1 ||
                item?.sku?.toLowerCase().indexOf('eco60') !== -1 ||
                item?.sku?.toLowerCase().indexOf('eco200') !== -1
        );
    }
    if (typeSelections.includes('doors')) {
        doorsData = inputData.filter(
            (item) => item?.sku?.toLowerCase().indexOf('mg1500') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mg1000') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mg1100') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mg3000') !== -1 ||
                item?.sku?.toLowerCase().indexOf('eco700') !== -1 ||
                item?.sku?.toLowerCase().indexOf('sgd') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mx3000') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mx4000') !== -1
        );
    }
    if (typeSelections.includes('storeFronts')) {
        storeFrontsData = inputData.filter(
            (item) => item?.sku?.toLowerCase().indexOf('mg500') !== -1 ||
                item?.sku?.toLowerCase().indexOf('mg5000') !== -1
        );
    }
    const finalData = [...accesoriesData, ...windowsData, ...doorsData, ...storeFrontsData];
    const uniqueIds = new Set();
    return finalData.filter((item) => {
        if (!uniqueIds.has(item.itemId)) {
            uniqueIds.add(item.itemId);
            return true;
        }
        return false;
    });
}

export function matchesColor(item, colorSelections) {
    if (!colorSelections.length) return true;

    const name = (item?.name || '').toLowerCase();
    const desc = (item?.description || '').toLowerCase();
    // SKU en mayúsculas y con espacios a los lados para poder buscar " B " / " BG "
    const skuUpper = ` ${(item?.sku || '').toUpperCase()} `;

    return colorSelections.some((color) => {
        switch (color) {
            case 'bronze':
                return (
                    name.includes('bronze') ||
                    desc.includes('bronze') ||
                    skuUpper.includes(' B ')
                );

            case 'white':
                return (
                    name.includes('white') ||
                    desc.includes('white') ||
                    skuUpper.includes(' W ')
                );

            case 'bronze_gray':
                return (
                    name.includes('bronze gray') ||
                    name.includes('bronze/gray') ||
                    desc.includes('bronze gray') ||
                    desc.includes('bronze/gray') ||
                    skuUpper.includes(' BG ')
                );

            case 'white_gray':
                return (
                    name.includes('white gray') ||
                    name.includes('white/gray') ||
                    desc.includes('white gray') ||
                    desc.includes('white/gray') ||
                    skuUpper.includes(' WG ')
                );

            case 'gray':
                return (
                    name.includes('gray') ||
                    desc.includes('gray') ||
                    skuUpper.includes(' G ')
                );

            default: {
                const keyword = color.toLowerCase().replace('_', ' ');
                return (
                    name.includes(keyword) ||
                    desc.includes(keyword) ||
                    skuUpper.toLowerCase().includes(color.toLowerCase())
                );
            }
        }
    });
}

export function matchesComun(item, selections) {
    const n = item?.name?.toLowerCase() || "";
    const sku = item?.sku?.toLowerCase() || "";
    const desc = item?.description?.toLowerCase() || "";

    return selections.some((c) => {
        const keyword = c.toLowerCase();

        if (keyword !== 'others') {

            // Regex: match exacto evitando MG3000 etc.
            const exactRegex = new RegExp(`\\b${keyword}\\b`);

            return (
                exactRegex.test(n) ||
                exactRegex.test(sku) ||
                exactRegex.test(desc)
            );

        }
        const itemOtherSeries = itemOthers.series;
        return itemOtherSeries.some((otherSeries) => {
            const otherKeyword = otherSeries.value.toLowerCase();
            const exactOtherRegex = new RegExp(`\\b${otherKeyword}\\b`);

            return (
                exactOtherRegex.test(n) ||
                exactOtherRegex.test(sku) ||
                exactOtherRegex.test(desc)
            );
        });
    });
}

// const itemClasses = [
//     { value: 'hr', label: 'Horizontal Rolling' },
//     { value: 'sh', label: 'Single Hung' },
//     { value: 'pw', label: 'Picture Window' },
//     { value: 'casement', label: 'Casement' },
//     { value: 'fd', label: 'French Door' },
//     { value: 'sgd', label: 'Sliding Glass Door' },
// ]

export function matchesClass(item, classSelections) {
    if (!classSelections.length) return true;

    const n = item?.name?.toLowerCase() || "";
    const sku = item?.sku?.toLowerCase() || "";
    const desc = item?.description?.toLowerCase() || "";

    if (classSelections.includes('hr')) {
        return (
            n.includes('horizontal rolling') ||
            sku.includes('hr') ||
            desc.includes('horizontal rolling')
        );
    }

    if (classSelections.includes('sh')) {
        return (
            n.includes('single hung') ||
            sku.includes('sh') ||
            desc.includes('single hung')
        );
    }

    if (classSelections.includes('pw')) {
        return (
            n.includes('picture window') ||
            sku.includes('pw') ||
            desc.includes('picture window')
        );
    }

    if (classSelections.includes('casement')) {
        return (
            n.includes('casement') ||
            sku.includes('casement') ||
            desc.includes('casement')
        );
    }

    if (classSelections.includes('fd')) {
        return (
            n.includes('french door') ||
            sku.includes('fd') ||
            desc.includes('french door')
        );
    }

    if (classSelections.includes('sgd')) {
        return (
            n.includes('sliding glass door') ||
            sku.includes('sgd') ||
            desc.includes('sliding glass door')
        );
    }

    return false;
}