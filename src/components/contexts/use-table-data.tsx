/**
 * External dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
// import { Input } from '../inputs/Input';
import Badge from '../badge/Badge';
import ListItemMenu from './ListItemMenu';
import { ITableHeader, ITableRow } from '../table/TableInterface';
import { capitalize } from '../../utils/StringHelper';

export const useTableHeaderData = (): ITableHeader[] => {
    return [
        {
            key: 'sl',
            title: 'Sl',
            className: '',
        },
        {
            key: 'title',
            title: __('Context', 'article-gen'),
            className: '',
        },
        {
            key: 'context_type',
            title: __('Context type', 'article-gen'),
            className: '',
        },
        {
            key: 'company',
            title: __('Company', 'article-gen'),
            className: '',
        },
        {
            key: 'status',
            title: __('Status', 'article-gen'),
            className: '',
        },
        {
            key: 'actions',
            title: __('Action', 'article-gen'),
            className: '',
        },
    ];
};

export const useTableRowData = (contexts = [], checked: number[]): ITableRow[] => {
    const rowsData: ITableRow[] = [];

    contexts.forEach((row, index) => {
        rowsData.push({
            id: row.id,
            cells: [
                {
                    key: 'sl',
                    value: (
                        // <Input
                        //     value={checked.includes(row.id) ? '1' : '0'}
                        //     type="checkbox"
                        //     //  onChange={() => checkContext(row.id)}
                        // />
                        <>
                            <b>{index + 1}</b>
                        </>
                    ),
                    className: '',
                },
                {
                    key: 'title',
                    value: row.title,
                    className: '',
                },
                {
                    key: 'context_type',
                    value: row.context_type?.name,
                    className: '',
                },
                {
                    key: 'company',
                    value: (
                        <div className="flex">
                            <div className="flex-6">
                                <img
                                    src={row.company?.avatar_url}
                                    alt=""
                                    className="mr-3 w-7 rounded-full"
                                />
                            </div>
                            <div className="flex-6">{row.company?.name}</div>
                        </div>
                    ),
                    className: '',
                },
                {
                    key: 'status',
                    value: (
                        <Badge
                            text={capitalize(row.status)}
                            type={
                                row.status === 'published'
                                    ? 'success'
                                    : 'default'
                            }
                            hasIcon={true}
                        />
                    ),
                    className: '',
                },
                {
                    key: 'actions',
                    value: (
                        <div>
                            <ListItemMenu context={row} />
                        </div>
                    ),
                    className: '',
                },
            ],
        });
    });

    return rowsData;
};