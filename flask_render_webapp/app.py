# app.py

"""""""""""""""""
Import Library
"""""""""""""""""

from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
from werkzeug.utils import secure_filename
from collections import OrderedDict
import pandas as pd
import numpy as np
import os
import json

# from process import *
# import mapper.master
# import mapper.mapper_data


from .process import (
    set_filter, ensure_folder_exists, process_blueprint,
    process_step_a, process_step_b,
    assign_order_sequence, assign_order_sequence_batch,
    get_picklist_batch, get_orderlist_batch, load_filtered_data,
    assign_all_batch, dropdown_all_batch, picklist, orderlist,
    data_overview, generate_list, get_latest_folder, latest_tracking_files,
    process_abx, process_sf, process_nv, export_file, awb_ninjavan,
    awb_abx, awb_sf, scan_mp, scan_web, tracking_update, order_mark
)

from . import mapper
# from .mapper import (mapper_data, master)


app = Flask(__name__)
app.register_blueprint(process_blueprint, url_prefix='/process')

# Global Variables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DOWNLOAD_FOLDER = os.path.join(BASE_DIR, 'downloads')
EXPORT_FOLDER = os.path.join(BASE_DIR, 'exports')
MAPPER_FOLDER = os.path.join(BASE_DIR, 'mapper')
ALLOWED_EXTENSIONS = {'csv', 'xlsx'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['DOWNLOAD_FOLDER'] = DOWNLOAD_FOLDER
app.config['EXPORT_FOLDER'] = EXPORT_FOLDER


# Data from master and mapper
DF_MASTER = pd.DataFrame(mapper.master.get_master_data()).copy()
SHIPPER = pd.DataFrame(mapper.mapper_data.get_courier_state_data()).copy()
SIZE = pd.DataFrame(mapper.mapper_data.get_size_data()).copy()

# Variables
FILTER = None
BATCH = None

# Create folder to contain files
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
if not os.path.exists(EXPORT_FOLDER):
    os.makedirs(EXPORT_FOLDER, exist_ok=True)

# Function : check for allowed files
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Function : check for latest files from upload folder
def get_latest_file():
    files = [f for f in os.listdir(UPLOAD_FOLDER) if allowed_file(f)]
    if not files:
        return None

    files = [f for f in files if f not in ['order_step_a.csv', 'order_step_b.csv']]
    latest_file = max(files, key=lambda f: os.path.getctime(os.path.join(UPLOAD_FOLDER, f)))
    return os.path.join(UPLOAD_FOLDER, latest_file)

"""
    # Folder dalam Supabase bucket
    supabase_folder = 'upload'

    try:
        # Senaraikan fail dalam supabase folder
        files = list_supabase_files('uploads', supabase_folder)
        files = [f for f in files if allowed_file(f)]
        files = [f for f in files if f not in ['order_step_a.csv', 'order_step_b.csv']]

        if not files:
            return None

        # Anggap fail terbaru ialah paling akhir dalam list (boleh diubah ikut timestamp jika perlu)
        latest_file = files[-1]

        # Fail dari Supabase yang akan di-download
        supabase_file_path = f'{supabase_folder}/{latest_file}'
        local_file_path = os.path.join(UPLOAD_FOLDER, latest_file)

        # Muat turun fail ke uploads/
        download_from_supabase('uploads', supabase_file_path, local_file_path)

        return local_file_path
    except Exception as e:
        print(f'{get_latest_file.__name__} : Error fetching latest file: {str(e)}')
        return None
"""


"""""""""""""""""
Route
"""""""""""""""""

# Endpoint : Upload files
"""
# @app.route('/upload', methods=['POST'])
# def upload_file():
#     if 'file' not in request.files:
#         return jsonify({'message': 'No file part'})
#     file = request.files['file']

#     if file.filename == '':
#         return jsonify({'message': 'No selected file'})

#     if file and allowed_file(file.filename):
#         file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
#         file.save(file_path)
#         return jsonify({'message': 'File uploaded successfully'})
#     return jsonify({'message': 'Invalid file format'})
"""

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files or 'folder' not in request.form:
        return jsonify({'success': False, 'message': 'Missing file or folder'})

    file = request.files['file']
    selected_folder = request.form['folder'].lower().strip()

    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'})

    if file and allowed_file(file.filename):
        # Default = simpan terus dalam uploads/
        if selected_folder == 'upload':
            folder_path = app.config['UPLOAD_FOLDER']
        else:
            folder_path = os.path.join(app.config['UPLOAD_FOLDER'], selected_folder)

        ensure_folder_exists(folder_path)
        file_path = os.path.join(folder_path, file.filename)
        file.save(file_path)
        """
        # # Simpan ke Supabase sebagai simpanan kekal
        # supabase_path = f'{selected_folder}/{file.filename}'  # contoh: 'upload/fail.xlsx'
        # upload_to_supabase(file_path, 'uploads', supabase_path)  # 'uploads' = bucket name
        # return jsonify({'success': True, 'message': f'File uploaded to "{selected_folder}" and saved to Supabase'})
        """

        return jsonify({'success': True, 'message': f'File uploaded to "{selected_folder}" folder successfully'})

    return jsonify({'success': False, 'message': 'Invalid file format'})


# # Endpoint : Download files
# @app.route('/download', methods=['GET'])
# def download_file():
#     files = os.listdir(EXPORT_FOLDER)
#     return render_template('download.html', files=files)


"""""""""""""""""
Endpoint for Data Processing
"""""""""""""""""
# Endpoint : Data processing after files uploaded
@app.route('/process_step_a', methods=['GET'])
def process_uploaded_file():
    latest_file = get_latest_file()
    if not latest_file:
        return jsonify({
            'status': 'error', 'message': 'No uploaded files found'})
    try:
        output_file = os.path.join(DOWNLOAD_FOLDER, 'order_step_a.csv')

        if os.path.exists(output_file):
            os.remove(output_file)
            print(f'{process_uploaded_file.__name__} : Delete old file: {output_file}')
        if latest_file.endswith('.csv'):
            df = pd.read_csv(latest_file, encoding='utf-8', errors='replace')
        else:
            df = pd.read_excel(latest_file)
        print(f'{process_uploaded_file.__name__} : File Loaded: {latest_file}, Columns: {df.columns.tolist()}')

    except Exception as e:
        print(f'{process_uploaded_file.__name__} : Error reading file: {str(e)}')
        return jsonify({
            'status': 'error', 'message': f'Error reading file: {str(e)}'})

    step_a = process_step_a(df, DF_MASTER, SHIPPER, SIZE)

    # return processed data as JSON
    if step_a is None or step_a.empty:
        print(f'{process_uploaded_file.__name__} : Processing failed! Data is empty.')
        # return jsonify({
        #     'status': 'success', 'step_a': step_a.to_dict(orient='records')})
        return jsonify({'status': 'success', 'step_a': []})

    try:
        step_a.to_csv(output_file, index=False, encoding='utf-8')
        print(f'{process_uploaded_file.__name__} : Processed file saved: {output_file}')
        """
        # # Upload hasil ke Supabase folder 'downloads'
        # upload_to_supabase(output_file, 'downloads', 'order_step_a.csv')
        """
    except Exception as e:
        print(f'{process_uploaded_file.__name__} : Error saving processed file: {str(e)}')
        return jsonify({
            'status': 'error', 'message': f'Error saving processed file: {str(e)}'})

    return jsonify({
        'status': 'success', 'message': 'File processed and saved.',
        'file': output_file})


"""""""""""""""""
Endpoint for Data Filtering
"""""""""""""""""
# Endpoint : Filter data after processed
@app.route('/process_step_b', methods=['POST'])
def process_filtered_data():
    data = request.get_json()
    print(f'{process_filtered_data.__name__} : Received Data: {data}')
    if not data:
        return jsonify({
            'status': 'error',
            'message': 'No filtered files foud'})

    selected_design = data.get('designs', [])
    filter_design = data.get('filter_design', 'none')
    selected_warehouse = data.get('warehouse', 'none')
    selected_platform = data.get('platform', 'none')
    selected_stores = data.get('stores', [])
    # filter_batch = data.get('filter_batch', 'none')

    # call function from process.py
    step_b = process_step_b(
        selected_design, filter_design, selected_warehouse,
        selected_platform, selected_stores
        )
    step_b['Batch'] = 1

    # df = step_b.copy()
    # df['__filter_option__'] = filter_design
    # df['__filter_designs__'] = ','.join(selected_design)

    # FILTER = df

    # return processed data as JSON
    if step_b is None or step_b.empty:
        print(f'{process_filtered_data.__name__} : Error: No data found after filtering!')
        return jsonify({
            'status': 'error',
            'message': 'No data found after filtering'})
    # return jsonify({'status': 'success', 'filtered_data': step_b.to_dict(orient='records')})
    
    os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
    output_file = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')

    try:
        step_b.to_csv(output_file, index=False, encoding='utf-8')
        print(f'{process_filtered_data.__name__} : Processed file saved: {output_file}')

    except Exception as e:
        print(f'{process_filtered_data.__name__} : Error saving processed file: {str(e)}')
        return jsonify({'status': 'error', 'message': f'Error saving processed file: {str(e)}'})

    return jsonify({'status': 'success', 'message': 'File processed and saved successfully.', 'file': output_file})


"""""""""""""""""
Endpoint for List Generation
"""""""""""""""""
# Endpoint : Generate data after filtered
@app.route('/list', methods=['POST'])
def process_generate_list():
    global FILTER
    data = request.get_json()
    print(f'{process_generate_list.__name__} : Received Data: {data}')
    if not data:
        return jsonify({
            'status': 'error',
            'message': 'No files found'})

    option = data.get('options', '')

    generate = generate_list(option)
    if generate is None or generate.empty:
        print(f'{process_generate_list.__name__} : Error: No data found to generate list')
        return jsonify({
            'status': 'error',
            'message': 'No data found to generate list'})

    output_file = os.path.join(DOWNLOAD_FOLDER, f'{option}.csv')
    os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
    try:
        generate.to_csv(output_file, index=False, encoding='utf-8')
        print(f'{process_generate_list.__name__} : Processed file saved: {output_file}') # debug
    except Exception as e:
        print(f'{process_generate_list.__name__} : Error saving processed file: {str(e)}') # debug
        return jsonify({
            'status': 'error',
            'message': f'Error saving processed file: {str(e)}'
            })
    return jsonify({
        'status': 'success',
        'message': f'{option.capitalize()} list processed and saved successfully.',
        'file': output_file
    })


"""""""""""""""""
Endpoint for Data Grouping
"""""""""""""""""
# Endpoint : Batch data after filtered
@app.route('/batch', methods=['GET'])
def process_batch():
    global BATCH

    filter_batch = request.args.get('filter_batch', 'none')
    min_last_batch_size = int(request.args.get('min_last_batch_size', 30))

    try:
        min_last_batch_size
        #  = int(min_last_batch_size)
    except (ValueError, TypeError):
        min_last_batch_size = 30
        return jsonify({'error': 'Invalid min_last_batch_size'}), 400

    csv_path = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')

    if os.path.exists(csv_path):
        try:
            # df = pd.read_csv(csv_path, encoding='utf-8')
            BATCH = pd.read_csv(csv_path, encoding='utf-8')
        except Exception as e:
            print(f'{process_batch.__name__} : Error reading CSV: {e}')
            return jsonify({'status': 'error', 'message': 'Error reading CSV'}), 500
    else:
        return jsonify({'status': 'error', 'message': 'No data available'}), 404

    try:
        BATCH = assign_all_batch(BATCH,
                                min_last_batch_size=min_last_batch_size,
                                filter_batch=filter_batch)
        dropdown = dropdown_all_batch(BATCH, filter_batch)
        dropdown_value = [{
            'label': b['label'],
            'value': int(b['value'])} for b in dropdown]

    except Exception as e:
        import traceback
        print(f'{process_batch.__name__} : Error in /batch: {e}')
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

    output_file = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')
    BATCH.to_csv(output_file, index=False, encoding='utf-8')

    return jsonify({'status': 'success', 'batches': dropdown_value})


"""""""""""""""""
Endpoint for Data Printing
"""""""""""""""""
# Endpoint : Print data after filtered
@app.route('/print_table/<list_type>', methods=['GET'])
def print_table_data(list_type):
    batch_no = request.args.get('batch', default=0, type=int)
    global BATCH

    if BATCH is None or BATCH.empty:
        csv_path = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')
        if os.path.exists(csv_path):
            BATCH = pd.read_csv(csv_path, encoding='utf-8')

    df = BATCH.copy()
    if batch_no > 0:
        df = df[df['Batch'] == batch_no]

    if list_type == 'picklist':
        df = get_picklist_batch(batch_no)
        columns = ['NO', 'LOCATION', 'SKU', 'PRODUCT NAME', 'QTY', 'ORDER QTY']
    elif list_type == 'orderlist':
        df = get_orderlist_batch(batch_no)
        columns = ['NO', 'ORDER NO', 'RECEIVER', 'PRODUCT NAME', 'QTY', 'SHIPPER']
    else:
        return jsonify({'status': 'error', 'message': 'Invalid list type'})

    try:
        df = df[columns].fillna('')
        records = [OrderedDict((col, row[col]) for col in df.columns) for _, row in df.iterrows()]
        return jsonify({
            'columns': columns,
            'data': records
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})


"""""""""""""""""
Endpoint for Data Viewing
"""""""""""""""""
# Endpoint : View data after filtered
@app.route('/view_data/<folder>/<path:filename>', methods=['GET'])
def view_data(folder, filename):
    base_folder = {
        'uploads': UPLOAD_FOLDER,
        'downloads': DOWNLOAD_FOLDER,
        'exports': EXPORT_FOLDER
    }.get(folder)

    if not base_folder:
        return jsonify([])

    file_path = os.path.join(base_folder, filename)
    if not os.path.exists(file_path):
        return jsonify([])

    try:
        # Baca ikut extension fail
        if filename.endswith('.csv'):
            df = pd.read_csv(file_path, encoding='utf-8')
        elif filename.endswith('.xlsx'):
            df = pd.read_excel(file_path)
        else:
            return jsonify({'error': 'File type not supported'})

        batch = request.args.get('batch')

        # Optional filter if filename related to batch
        if filename.startswith('picklist') or filename.startswith('orderlist'):
            if batch and 'Batch' in df.columns:
                df = df[df['Batch'] == int(batch)]

        return df.to_json(orient='records')
    except Exception as e:
        print(f'{view_data.__name__} : Error loading {filename}: {str(e)}')
        return jsonify({'error': str(e)})

"""
@app.route('/view_data/<filename>', methods=['GET'])
def view_data(filename):
    file_path = os.path.join(DOWNLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify([])

    try:
        df = pd.read_csv(file_path, encoding='utf-8')
        batch = request.args.get('batch', None)

        if filename.startswith('picklist') or filename.startswith('orderlist'):
            if batch and 'Batch' in df.columns:
                df = df[df['Batch'] == int(batch)]

        return df.to_json(orient='records')
    except Exception as e:
        print(f'{view_data.__name__} : Error loading {filename}: {str(e)}')
        return jsonify([])
"""


"""""""""""""""""
Endpoint for Exporting Output
"""""""""""""""""
# Endpoint : Export data after filtered
@app.route('/export', methods=['POST'])
def process_export_file():
    global FILTER
    if FILTER is None or FILTER.empty:
        print(f'{process_export_file.__name__} : FILTER is empty !')
        FILTER = os.path.join(DOWNLOAD_FOLDER,'order_step_b.csv')
        
    csv_path = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')
    
    if os.path.exists(csv_path):
        FILTER = pd.read_csv(csv_path, encoding='utf-8', low_memory=False)
    else:
        return jsonify({
            'status': 'error', 'message': 'No data to export'})
        
    try:
        file_paths = export_file(FILTER)
        return jsonify({
            'status': 'success', 'files': file_paths})
    except Exception as e:
        return jsonify({
            'status': 'error','message': str(e)})
        # return send_file(file_path, as_attachment=True)


@app.route('/export_ordermark', methods=['POST'])
def generate_filtered_orders():
    data = request.get_json()
    selected_design = data.get('designs', [])
    filter_design = data.get('filter_design', 'none')
    label = data.get('label', '')

    try:
        # df = FILTER.copy()

        csv_path = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv').copy()
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path, encoding='utf-8')
            if df is None or df.empty:
                print(f'{generate_filtered_orders.__name__} : FILTER is empty !')
        else:
            return jsonify({'status': 'error', 'message': 'No data to export'})

        filtered = order_mark(df, selected_design, filter_design)

        return jsonify({'status': 'success', 'file': filtered})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


"""""""""""""""""
Endpoint for Chart Data
"""""""""""""""""
# Endpoint : Chart data for visualization
# @app.route('/chartdata')
# def chartdata():
#     csv_path = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')
#     if not os.path.exists(csv_path):
#         return jsonify({'status': 'error', 'message': 'CSV file not found'})

#     df = pd.read_csv(csv_path, encoding='utf-8')
#     df_grouped = df.copy()
#     if 'Store' not in df.columns:
#         return jsonify({'status': 'error', 'message': 'Missing "Store" column'})

#     # Group dan kira
#     # df_grouped = df.groupby(['Platform', 'Design'])['Order No'].nunique().reset_index(name='Total Orders')
#     df_grouped = df.groupby(['Design'])['Quantity'].sum().reset_index(name='Total Orders')
#     # df_grouped = df.groupby(['Design'])['Order No'].nunique().reset_index(name='Total Orders')
#     df_grouped = df_grouped.sort_values(by='Total Orders', ascending=False)[:20]

#     df_grouped['Design'] = df_grouped['Design'].replace({
#         'TIK': 'TikTok', 'SHO': 'Shopee', 'ZAL': 'Zalora','LAZ': 'Lazada',
#         'WEB NV': 'Ninjavan', 'WEB AB': 'ABX', 'WEB SF': 'SF Express',
#         'WEB OS': 'Oversea', 'WEB SP': 'Self Pickup'
#     })

#     df_grouped = df_grouped[['Design', 'Total Orders']]

#     x = df_grouped['Design'].tolist()
#     y = df_grouped['Total Orders'].tolist()

#     return jsonify({'status': 'success', 'x': x, 'y': y})


@app.route('/chartdata')
def chartdata():
    csv_path = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')
    if not os.path.exists(csv_path):
        return jsonify({'status': 'error', 'message': 'CSV file not found'})

    df = pd.read_csv(csv_path, encoding='utf-8')
    df_chart = df.copy()

    # Group by
    bar_order_sum = df_chart.groupby(['Store'])['Order No'].nunique().reset_index(name='Total Orders')
    bar_order_sum = bar_order_sum.sort_values(by='Total Orders', ascending=False)
    # bar_order_sum = df_chart.groupby(['Store'])['Quantity'].sum().reset_index(name='Total Orders')
    bar_order_sum['Store'] = bar_order_sum['Store'].replace({
        'TIK': 'TikTok', 'SHO': 'Shopee', 'ZAL': 'Zalora','LAZ': 'Lazada',
        'WEB NV': 'Ninjavan', 'WEB AB': 'ABX', 'WEB SF': 'SF Express',
        'WEB OS': 'Oversea', 'WEB SP': 'Self Pickup'
    })

    bar_product_sum = df_chart.groupby(['Design'])['Order No'].nunique().reset_index(name='Total Orders')
    bar_product_sum = bar_product_sum.sort_values(by='Total Orders', ascending=False)[:20]

    bar_product_qty = df_chart.groupby(['Design'])['Quantity'].sum().reset_index(name='Total Orders')
    bar_product_qty = bar_product_qty.sort_values(by='Total Orders', ascending=False)[:20]

    line_order_daily = df_chart.copy()
    line_order_daily['Order Time'] = pd.to_datetime(line_order_daily['Order Time'], errors='coerce').dt.strftime('%Y-%m-%d')
    line_order_daily = line_order_daily.groupby('Order Time')['Order No'].count().reset_index(name='Total Orders')
    line_order_daily = line_order_daily.sort_values(by='Order Time', ascending=True)

    line_order_monthly = df_chart.copy()
    line_order_monthly['Order Time'] = pd.to_datetime(line_order_monthly['Order Time'], errors='coerce').dt.strftime('%Y-%m')
    line_order_monthly = line_order_monthly.groupby('Order Time')['Order No'].count().reset_index(name='Total Orders')
    line_order_monthly = line_order_monthly.sort_values(by='Order Time', ascending=True)

    # Get necessary column
    bar_product_qty = bar_product_qty[['Design', 'Total Orders']]
    bar_product_sum = bar_product_sum[['Design', 'Total Orders']]
    line_order_daily = line_order_daily[['Order Time', 'Total Orders']]
    line_order_monthly = line_order_monthly[['Order Time', 'Total Orders']]

    chart_type = request.args.get('type', 'orders')

    if chart_type == 'product_summary':
        # generate orders chart data
        # bar_product_sum = bar_chart(df_chart)
        data = {
            'status': 'success', 'title': 'Total Products by Order', 'label': 'Total',
            'x': bar_product_sum['Design'].tolist(), 'y': bar_product_sum['Total Orders'].tolist() }
    elif chart_type == 'product_qty':
        data = {
            'status': 'success', 'title': 'Total Products by Quantity',
            'x': bar_product_qty['Design'].tolist(), 'y': bar_product_qty['Total Orders'].tolist() }
    elif chart_type == 'order_summary':
        # generate revenue chart data
        data = {
            'status': 'success', 'title': 'Total Orders by Store', 'label': '',
            'x': bar_order_sum['Store'].tolist(), 'y': bar_order_sum['Total Orders'].tolist()}
    elif chart_type == 'order_daily':
        # generate revenue chart data
        data = {
            'status': 'success', 'title': 'Total Orders by Daily', 'label': 'Order',
            'x': line_order_daily['Order Time'].tolist(), 'y': line_order_daily['Total Orders'].tolist()}
    elif chart_type == 'order_monthly':
        # generate revenue chart data
        data = {
            'status': 'success', 'title': 'Total Orders by Monthly', 'label': 'Order',
            'x': line_order_monthly['Order Time'].tolist(), 'y': line_order_monthly['Total Orders'].tolist()}

    else:
        data = { 'status': 'fail', 'message': 'Unknown chart type' }

    return jsonify(data)

"""""""""""""""""
index.html
"""""""""""""""""
# Main page
@app.route('/')
def index():
    year = pd.Timestamp.now().year
    TRADEMARK = f'©{year} Order Processing Web App - developed by Arep.'
    RIGHTS = 'All rights reserved.'
    return render_template('index.html', trademark=TRADEMARK, rights=RIGHTS)


# Route untuk senarai design
@app.route('/design_list')
def get_design_list():
    try:
        df = pd.read_csv(os.path.join(MAPPER_FOLDER, 'csv','design_name.csv'), encoding='utf-8')
    except Exception as e:
        return jsonify({
            'status': 'error', 'message': f'Error reading file: {str(e)}'})

    designs = df['Design_Name'].dropna().unique().tolist()
    designs_name_color = df['Name_Color_Size'].dropna().unique().tolist()
    designs_color = df['Name_Color'].dropna().unique().tolist()
    designs_size = df['Name_Size'].dropna().unique().tolist()

    return jsonify({
        'status': 'success',
        'designs': designs, 'designs_name_color': designs_name_color,
        'designs_color': designs_color, 'designs_size': designs_size})


# Route untuk papar table
@app.route('/table', methods=['GET'])
def get_table():
    list_type = request.args.get('listType')
    selected_batch = int(request.args.get('batch', 1))  # Default ke batch 1 jika kosong

    if FILTER is None or FILTER.empty:
        return jsonify({'status': 'error', 'message': 'No data available'})

    df_filtered = FILTER[FILTER['Batch'] == selected_batch]

    # Hantar data ke template
    return jsonify({'status': 'success', 'html': df_filtered.to_html()})


"""""""""""""""""
list_file.html
"""""""""""""""""
# Route untuk simpan fail selepas dimuat naik
@app.route('/files', methods=['GET'])
def list_files():
    categorized_files = {}

    default_files = [
        f for f in os.listdir(UPLOAD_FOLDER)
        if os.path.isfile(os.path.join(UPLOAD_FOLDER, f)) and allowed_file(f)
    ]
    categorized_files['default'] = default_files

    for folder_name in os.listdir(UPLOAD_FOLDER):
        folder_path = os.path.join(UPLOAD_FOLDER, folder_name)

        if os.path.isdir(folder_path):
            sub_files = [
                f for f in os.listdir(folder_path)
                if os.path.isfile(os.path.join(folder_path, f)) and allowed_file(f)
            ]
            categorized_files[folder_name] = sub_files

    return render_template('list_file.html', categorized_files=categorized_files)

# @app.route('/delete_file/<filename>', methods=['POST'])
# def delete_file(filename):
#     file_path = os.path.join(UPLOAD_FOLDER, filename)
#     if os.path.exists(file_path):
#         os.remove(file_path)
#         return jsonify({'status': 'success', 'message': f'File {filename} deleted'})
#     return jsonify({'status': 'error', 'message': 'File not found'}), 404

# # Route untuk delete fail
# @app.route('/delete_file/<folder>/<filename>', methods=['POST'])
# def delete_file(folder, filename):
#     if folder == 'default':
#         file_path = os.path.join(UPLOAD_FOLDER, filename)
#     else:
#         file_path = os.path.join(UPLOAD_FOLDER, folder, filename)

#     if os.path.exists(file_path):
#         os.remove(file_path)
#         return jsonify({'status': 'success', 'message': f'File {filename} deleted from {folder} folder'})
#     return jsonify({'status': 'error', 'message': f'File {filename} not found in {folder} folder'}), 404


"""""""""""""""""
list_download.html
"""""""""""""""""
# Endpoint : Download exported files
@app.route('/download', methods=['GET'])
def list_download():
    files = os.listdir(EXPORT_FOLDER)
    return render_template('list_download.html', files=sorted(files))

# # Endpoint : Download checkpoint files
# @app.route('/checkpoint', methods=['GET'])
# def list_checkpoint():
#     files = os.listdir(DOWNLOAD_FOLDER)
#     return render_template('list_checkpoint.html', files=files)



"""""""""""""""""
list_download.html & list_file.html
"""""""""""""""""
@app.route('/delete_file/<folder>/<path:filename>', methods=['POST'])
def delete_file(folder, filename):
    folder_map = {
        'uploads': UPLOAD_FOLDER,
        'downloads': DOWNLOAD_FOLDER,
        'exports': EXPORT_FOLDER
    }

    base_folder = folder_map.get(folder)
    if not base_folder:
        return jsonify({'success': False, 'message': 'Invalid folder'}), 400

    file_path = os.path.join(base_folder, filename)

    if not os.path.exists(file_path):
        return jsonify({'success': False, 'message': 'File not found'}), 404

    try:
        os.remove(file_path)
        return jsonify({'success': True, 'message': 'File deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to delete: {str(e)}'}), 500


@app.route('/download_file/<folder>/<path:filename>')
def download_file(folder, filename):
    folder_map = {
        'uploads': UPLOAD_FOLDER,
        'downloads': DOWNLOAD_FOLDER,
        'exports': EXPORT_FOLDER
    }

    base_folder = folder_map.get(folder)
    if not base_folder:
        return 'Invalid folder', 400

    file_path = os.path.join(base_folder, filename)

    if not os.path.isfile(file_path):
        return 'File not found', 404

    return send_file(file_path, as_attachment=True)


"""""""""""""""""
scan.html
"""""""""""""""""
# # Route untuk cari tracking number
# @app.route('/search', methods=['POST'])
# def search_tracking():
#     data = request.get_json()
#     tracking_number = data.get('tracking_number')

#     # Semak jika ada fail yang telah diupload
#     files = os.listdir(UPLOAD_FOLDER)
#     if not files:
#         return jsonify({'status': 'error', 'message': 'No uploaded files found'})

#     # Ambil fail terakhir yang diupload
#     latest_file = os.path.join(UPLOAD_FOLDER, files[-1])

#     # Baca file Excel atau CSV
#     if latest_file.endswith('.csv'):
#         df = pd.read_csv(latest_file)
#     else:
#         df = pd.read_excel(latest_file)

#     # Pastikan column 'Tracking Number' wujud
#     if 'Tracking Number' not in df.columns:
#         return jsonify({'status': 'error', 'message': 'Invalid file format, missing "Tracking Number" column'})

#     # Cari tracking number
#     result_df = df[df['Tracking Number'] == tracking_number]

#     if result_df.empty:
#         return jsonify({'status': 'not_found'})

#     # Pilih column yang diperlukan
#     selected_columns = [
#         'Order No', 'SKU', 'Product Name', 'Quantity'
#         ]
#     result_data = result_df[selected_columns].to_dict(orient='records')

#     return jsonify({'status': 'found', 'results': result_data})

# # Route untuk scan barcode
# @app.route('/scan_items')
# def scan_items():
#     tracking_number = request.args.get('tracking')
#     items = orders.get(tracking_number, [])  # Dapatkan item berkaitan tracking number
#     return render_template('scan_inhan.html', tracking_number=tracking_number, items=items)


# Run server Flask
if __name__ == '__main__':
    app.run(debug=True)
