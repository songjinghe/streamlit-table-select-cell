import {
  ArrowTable,
  Streamlit,
  ComponentProps,
  withStreamlitConnection,
} from "streamlit-component-lib"

import React, { useEffect, useMemo, useState } from "react";
import { useTable } from "react-table";


interface State {
  colIndex:number
  rowId:string
}

function toTableOpts(table: ArrowTable){
  const columns = []
  const colIndex2NameMap:{ [key: string]: string } = {}
  for(let i=table.headerColumns; i<table.headerColumns+table.dataColumns; i++){
    let txt = table.getCell(0, i).content
    let headerName:string = txt? txt.toString() : ''
    colIndex2NameMap[(i-table.headerColumns).toString()] = headerName
    columns.push({Header: headerName, accessor: headerName})
  }
  console.debug('st_table_select_cell', colIndex2NameMap)
  const rawTable = table.table
  const data = []
  for(let row of rawTable.toArray()){
    const record:{ [key: string]: any } = {}
    for(let cell of row){
      // console.log(cell)
      const columnId = cell[0]
      const colName = colIndex2NameMap[columnId]
      const content = cell[1]
      record[colName] = content
    }
    data.push(record)
  }
  return {data, columns}
}

const TableSelectCell: React.FC<ComponentProps> = (props) => {
  const [state, setState]:[State, any] = useState<State>({ colIndex: -1, rowId: '' })
  useEffect(() => {
    Streamlit.setFrameHeight()
  }, [state])
  const table: ArrowTable = props.args['data']
  const tOpts = useMemo(()=>toTableOpts(table), [table])
  console.debug('[st_table_select_cell] init', state, tOpts)
  // const titleKey = props.args['title']
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    // footerGroups,
    rows,
    prepareRow
  } = useTable(tOpts)

  const getCellValue = (e:any, j:number): void => {
    console.debug('[st_table_select_cell] clicked', e.row.id, j);
    const state = {rowId: e.row.id, colIndex: j}
    setState(state)
    Streamlit.setComponentValue(state)
  };

  // Arguments that are passed to the plugin in Python are accessible
  // via `this.props.args`. Here, we access the "name" arg.
  // Streamlit sends us a theme object via props that we can use to ensure
  // that our component has visuals that match the active theme in a
  // streamlit app.
  const { theme } = props
  const style: React.CSSProperties = {}
  // Maintain compatibility with older versions of Streamlit that don't send
  // a theme object.
  if (theme) {
    // Use the theme object to style our button border. Alternatively, the
    // theme style is defined in CSS vars.
    const borderStyling = 'none' //`1px solid ${theme.primaryColor}`
    style.border = borderStyling
    style.outline = borderStyling
  }

  // Show a table. When a cell of the table is clicked, we'll 
  // set its colIndex and rowIndex to our "state" variable, and 
  // send its new value back to Streamlit, where it'll
  // be available to the Python program.
  // const hasHeader = table.headerRows > 0
  // const hasData = table.dataRows > 0
  // const classNames = "table table-bordered" + (hasData ? '' : "empty-table")
  // const caption = table.caption ? <caption>{table.caption}</caption> : null
  return (
    <div style={style}>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell,j) => {
                  return (
                    <td
                      onClick={() => getCellValue(cell,j)}
                      style={{
                        padding: "6px",
                        border: "solid 1px #bbb",
                        background: state.rowId === row.id && state.colIndex === j ? 'yellow' : 'white'
                      }}
                      title={cell.value+' at ['+row.id+']['+j+']'}
                      {...cell.getCellProps()}
                    >{cell.value ? cell.value.toString() : ''}
                      {/* {cell.render("Cell")} */}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        {/* <tfoot>
          {footerGroups.map((footerGroup) => (
            <tr {...footerGroup.getFooterGroupProps()}>
              {footerGroup.headers.map((column) => (
                <td
                  style={{
                    padding: "10px",
                    border: "solid 1px gray",
                    background: "#ccc"
                  }}
                  {...column.getFooterProps()}
                >
                  {column.render("Footer")}
                </td>
              ))}
            </tr>
          ))}
        </tfoot> */}
      </table>
    </div>
  );
}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(TableSelectCell)
